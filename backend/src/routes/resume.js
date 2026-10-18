/**
 * resume.js — Resume upload, retrieval, and deletion endpoints.
 *
 * All routes sit under /api/candidates/:id/resume and are protected
 * by the existing `protect` middleware.
 *
 * POST   /api/candidates/:id/resume           — upload or replace
 * GET    /api/candidates/:id/resume           — stream PDF inline (view)
 * GET    /api/candidates/:id/resume?download  — stream PDF as attachment (download)
 * DELETE /api/candidates/:id/resume           — remove from Cloudinary + clear metadata
 *
 * ── How streaming works ───────────────────────────────────────────────
 * Instead of returning a Cloudinary signed URL for the browser to open
 * (which fails for cross-origin private assets and lacks Content-Type),
 * the backend fetches the PDF from Cloudinary server-side using a signed
 * URL, then pipes the raw bytes to the client with:
 *   Content-Type: application/pdf
 *   Content-Disposition: inline | attachment
 * The frontend uses Axios (withCredentials) + responseType:'blob', so the
 * auth cookie is sent correctly across origins.
 */
import { Router } from 'express'
import mongoose from 'mongoose'
import { Readable } from 'stream'
import { randomUUID } from 'crypto'

import { protect } from '../middleware/auth.js'
import Candidate from '../models/Candidate.js'
import cloudinary, { cloudinaryConfigured } from '../lib/cloudinary.js'
import { uploadResume, handleUploadErrors, isPdfBuffer } from '../lib/upload.js'

const router = Router({ mergeParams: true }) // inherit :id from parent

// All resume routes require authentication
router.use(protect)

// ── Helpers ────────────────────────────────────────────────

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

/** Check Cloudinary credentials and respond 503 if absent */
function requireCloudinary(res) {
  if (!cloudinaryConfigured()) {
    res.status(503).json({
      success: false,
      message:
        'Resume storage is not configured. Add CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the server environment.',
    })
    return false
  }
  return true
}

/**
 * Upload a buffer to Cloudinary as a raw (PDF) resource.
 *
 * FIX: Do NOT specify `folder` when `public_id` already contains the full
 * folder path. Specifying both causes Cloudinary to prepend the folder a
 * second time, producing a doubled path like:
 *   hireflow/resumes/hireflow/resumes/{uuid}   ← wrong (old bug)
 *   hireflow/resumes/{uuid}                    ← correct (fixed)
 */
function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id:     publicId,    // full path e.g. hireflow/resumes/{uuid}
        resource_type: 'raw',       // required for non-image files (PDFs)
        // ⚠ No `folder` param — public_id already includes the folder
        type:          'private',   // private delivery — not publicly accessible
        overwrite:     true,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )
    Readable.from(buffer).pipe(stream)
  })
}

/**
 * Delete a stored Cloudinary asset by public_id.
 * Resolves regardless of whether the asset existed.
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'private' })
  } catch (err) {
    console.error('[Resume] Cloudinary delete failed:', err.message)
  }
}

/** Human-readable file size */
function humanBytes(bytes) {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Make a filename safe for a Content-Disposition header value.
 * - Strips path separators and control characters
 * - Preserves the original name as closely as possible
 * - Ensures .pdf extension
 */
function safeDispositionFilename(rawName) {
  const name = (rawName ?? 'resume.pdf')
    .replace(/[/\\]/g, '')          // no path separators
    .replace(/[\x00-\x1f"]/g, '_')  // no control chars or quotes
    .trim()
  // Ensure the name ends with .pdf
  return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`
}

// ── POST /api/candidates/:id/resume ──────────────────────
router.post('/', (req, res, next) => {
  uploadResume(req, res, (multerErr) => {
    handleUploadErrors(multerErr, req, res, next)
  })
}, async (req, res, next) => {
  try {
    if (!requireCloudinary(res)) return

    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    if (!req.file || !req.file.buffer || req.file.size === 0) {
      return res.status(400).json({ success: false, message: 'No file received.' })
    }

    if (!isPdfBuffer(req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'File does not appear to be a valid PDF.' })
    }

    const candidate = await Candidate.findById(id)
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    const previousPublicId = candidate.resume?.publicId ?? null

    // Clean public_id — folder included once in the path, no `folder` param
    const newPublicId = `hireflow/resumes/${randomUUID()}.pdf`

    let uploadResult
    try {
      uploadResult = await uploadBufferToCloudinary(req.file.buffer, newPublicId)
    } catch (uploadErr) {
      console.error('[Resume] Cloudinary upload failed:', uploadErr.message)
      return res.status(502).json({
        success: false,
        message: 'Resume upload failed. Please try again.',
      })
    }

    const resumeMeta = {
      publicId:     uploadResult.public_id,
      fileName:     req.file.originalname,
      bytes:        uploadResult.bytes,
      format:       uploadResult.format ?? 'pdf',
      resourceType: uploadResult.resource_type,
      uploadedAt:   new Date(),
    }

    try {
      candidate.resume = resumeMeta
      await candidate.save()
    } catch (dbErr) {
      await deleteFromCloudinary(uploadResult.public_id)
      console.error('[Resume] DB save failed after upload:', dbErr.message)
      return res.status(500).json({
        success: false,
        message: 'Resume uploaded but could not be saved. Upload was rolled back.',
      })
    }

    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
      await deleteFromCloudinary(previousPublicId)
    }

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully.',
      data: {
        fileName:   resumeMeta.fileName,
        bytes:      resumeMeta.bytes,
        size:       humanBytes(resumeMeta.bytes),
        uploadedAt: resumeMeta.uploadedAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/candidates/:id/resume ────────────────────────
// Streams the PDF through the Express backend so that:
//  - Content-Type: application/pdf is set correctly (Cloudinary raw assets
//    have no format metadata, so they'd be served as octet-stream)
//  - The auth cookie is respected (cross-origin window.open can't send cookies)
//  - Inline view (?download omitted) or force-download (?download=true) work
//
// The frontend uses Axios responseType:'blob', which sends the auth cookie,
// receives PDF bytes, then creates a local blob URL.
router.get('/', async (req, res, next) => {
  try {
    if (!requireCloudinary(res)) return

    const { id } = req.params
    const forceDownload = req.query.download === 'true'

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    const candidate = await Candidate.findById(id).lean()
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    if (!candidate.resume?.publicId) {
      return res.status(404).json({ success: false, message: 'No resume uploaded for this candidate.' })
    }

    const { publicId, fileName } = candidate.resume

    // ── Generate a short-lived private download URL ───────
    // IMPORTANT: public_id may or may not end in .pdf depending on when the
    // asset was uploaded. Use format='' (empty string) so private_download_url
    // does NOT append a format suffix to the URL. The publicId path already
    // ends in .pdf for new uploads (hireflow/resumes/{uuid}.pdf).
    //
    // Cloudinary raw-asset lookup is by exact publicId. Appending '.pdf' to
    // an asset that was stored WITHOUT that extension returns the correct
    // asset because Cloudinary strips the extension for raw lookups on the
    // api.cloudinary.com/raw/download endpoint, but we keep format='' here
    // to be safe and to avoid double-extension on new .pdf publicIds.
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      '',                             // no format suffix — publicId already ends .pdf (new assets)
      {
        resource_type: 'raw',
        type:          'private',
        expires_at:    Math.floor(Date.now() / 1000) + 120,
        attachment:    false,         // we set Content-Disposition ourselves
      },
    )

    // Fetch from Cloudinary on the server side (Node 20 built-in fetch)
    let cloudRes
    try {
      cloudRes = await fetch(signedUrl)
    } catch (fetchErr) {
      console.error('[Resume] Cloudinary network error:', fetchErr.message)
      return res.status(502).json({ success: false, message: 'Could not connect to resume storage.' })
    }

    if (!cloudRes.ok) {
      const body = await cloudRes.text().catch(() => '(unreadable)')
      console.error('[Resume] Cloudinary returned', cloudRes.status, body.slice(0, 200))
      return res.status(502).json({
        success: false,
        message: `Could not retrieve resume from storage (${cloudRes.status}).`,
      })
    }

    // Guard: reject responses that are clearly not PDF bytes.
    // Cloudinary raw assets are served as application/octet-stream (no format
    // metadata) — that is fine. Reject only HTML error pages and JSON errors.
    const contentType = cloudRes.headers.get('content-type') ?? ''
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      const preview = await cloudRes.text().catch(() => '')
      console.error('[Resume] Cloudinary returned non-PDF content-type:', contentType, preview.slice(0, 100))
      return res.status(502).json({ success: false, message: 'Resume storage returned an unexpected response.' })
    }

    // ── Build Content-Disposition ──────────────────────────
    const safeName = safeDispositionFilename(fileName)
    // RFC 5987 encoding for any non-ASCII characters in the filename
    const encodedName = encodeURIComponent(safeName).replace(/'/g, '%27')
    const disposition = forceDownload
      ? `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`
      : `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', disposition)
    res.setHeader('Cache-Control', 'no-store, no-cache')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Stream PDF bytes to the client
    Readable.fromWeb(cloudRes.body).pipe(res)

  } catch (err) {
    if (!res.headersSent) next(err)
    else res.end()
  }
})

// ── DELETE /api/candidates/:id/resume ────────────────────
router.delete('/', async (req, res, next) => {
  try {
    if (!requireCloudinary(res)) return

    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    const candidate = await Candidate.findById(id)
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    if (!candidate.resume?.publicId) {
      return res.status(404).json({ success: false, message: 'No resume to remove.' })
    }

    const { publicId } = candidate.resume

    candidate.resume = undefined
    await candidate.save()

    await deleteFromCloudinary(publicId)

    return res.status(200).json({ success: true, message: 'Resume removed successfully.' })
  } catch (err) {
    next(err)
  }
})

export default router
