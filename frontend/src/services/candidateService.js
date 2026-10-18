/**
 * candidateService.js
 * Centralized API layer for all candidate operations.
 * All functions return the data payload directly; errors are thrown
 * as Error objects with the backend message text.
 */
import apiClient from './apiClient.js'

// ── List with optional filters/pagination ─────────────────
export async function getCandidates(params = {}) {
  const res = await apiClient.get('/candidates', { params })
  return res.data // { success, data, pagination }
}

// ── Single candidate ──────────────────────────────────────
export async function getCandidate(id) {
  const res = await apiClient.get(`/candidates/${id}`)
  return res.data.data
}

// ── Create ────────────────────────────────────────────────
export async function createCandidate(payload) {
  const res = await apiClient.post('/candidates', payload)
  return res.data.data
}

// ── Update (partial) ──────────────────────────────────────
export async function updateCandidate(id, payload) {
  const res = await apiClient.patch(`/candidates/${id}`, payload)
  return res.data.data
}

// ── Update stage only ─────────────────────────────────────
export async function updateStage(id, stage) {
  return updateCandidate(id, { stage })
}

// ── Delete ────────────────────────────────────────────────
export async function deleteCandidate(id) {
  const res = await apiClient.delete(`/candidates/${id}`)
  return res.data
}

// ── Dashboard stats ───────────────────────────────────────
export async function getDashboardStats() {
  const res = await apiClient.get('/dashboard/stats')
  return res.data.data
}

// ── Resume operations ─────────────────────────────────────

/**
 * Upload (or replace) a candidate's resume.
 * @param {string}   id         - Candidate ID
 * @param {File}     file       - PDF File object from <input type="file">
 * @param {function} onProgress - optional (percent: number) => void
 */
export async function uploadResume(id, file, onProgress) {
  const form = new FormData()
  form.append('resume', file)
  // Do NOT set Content-Type manually — Axios/browser must generate the multipart boundary
  const res = await apiClient.post(`/candidates/${id}/resume`, form, {
    headers: { 'Content-Type': undefined },
    onUploadProgress: onProgress
      ? (evt) => {
          if (evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      : undefined,
  })
  return res.data
}

/**
 * Verify that a Blob starts with the PDF magic bytes (%PDF).
 * If the backend returned a JSON or HTML error body, this will be false.
 */
async function assertPdfBlob(blob) {
  const header = await blob.slice(0, 4).arrayBuffer()
  const bytes  = new Uint8Array(header)
  // PDF signature: 0x25 0x50 0x44 0x46 (%PDF)
  if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    // Try to extract an error message from the response body
    let serverMsg = ''
    try { serverMsg = JSON.parse(await blob.text()).message } catch { /* not JSON */ }
    throw new Error(serverMsg || 'Resume could not be retrieved. Please try again.')
  }
}

/**
 * Fetch resume bytes from the authenticated backend endpoint and return
 * a Blob.  The backend streams the PDF with Content-Type: application/pdf
 * so the browser never needs to open a Cloudinary URL directly.
 *
 * The auth cookie is sent automatically because apiClient has withCredentials:true.
 */
export async function viewResumeBlob(id) {
  const res = await apiClient.get(`/candidates/${id}/resume`, {
    responseType: 'blob',
    timeout: 30_000,
  })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  await assertPdfBlob(blob)   // throws if server returned JSON/HTML error bytes
  return blob
}

/**
 * Fetch resume bytes with ?download=true, which tells the backend to set
 * Content-Disposition: attachment.  Returns a Blob so the caller can
 * trigger a browser download with the original filename.
 */
export async function downloadResumeBlob(id) {
  const res = await apiClient.get(`/candidates/${id}/resume?download=true`, {
    responseType: 'blob',
    timeout: 30_000,
  })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  await assertPdfBlob(blob)   // throws if server returned JSON/HTML error bytes
  return blob
}

/**
 * Remove a candidate's resume from Cloudinary and clear the metadata.
 */
export async function deleteResume(id) {
  const res = await apiClient.delete(`/candidates/${id}/resume`)
  return res.data
}

/**
 * Request an AI-generated professional summary for a candidate.
 * The API key is stored server-side only — it is never sent to the frontend.
 *
 * NOTE: Summaries are NOT persisted. They live in frontend state only and
 * disappear when the drawer is closed or the candidate changes.
 *
 * @param {string} candidateId  - MongoDB ObjectId string
 * @returns {{ summary: string, generatedAt: string }}
 */
export async function generateAiSummary(candidateId) {
  // AI generation can take 10–25 seconds — override the default 10s client timeout.
  const res = await apiClient.post(`/candidates/${candidateId}/ai-summary`, undefined, {
    timeout: 50_000,  // 50 s — above the backend's 45 s provider timeout
  })
  return res.data  // { success, summary, generatedAt }
}

