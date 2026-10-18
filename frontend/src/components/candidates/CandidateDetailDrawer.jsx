import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, Mail, Phone, Briefcase, Calendar, MapPin, Pencil,
  FileText, Upload, Trash2, ExternalLink, Download, Loader2, AlertCircle,
  Sparkles, RefreshCw,
} from 'lucide-react'
import { formatDate, getInitials, stageBadgeClass } from '../../lib/utils.js'
import { uploadResume, viewResumeBlob, deleteResume, generateAiSummary } from '../../services/candidateService.js'
import ConfirmDialog from '../ConfirmDialog.jsx'

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']

/**
 * CandidateDetailDrawer — slide-in panel showing full candidate info.
 *
 * Props:
 *   candidate      object | null
 *   open           boolean
 *   onClose        () => void
 *   onEdit         (candidate) => void
 *   onStageChange  (id, stage) => void
 *   stageUpdating  boolean
 *   onCandidateUpdated (updatedCandidate) => void  — called after resume ops to refresh parent
 */
export default function CandidateDetailDrawer({
  candidate,
  open,
  onClose,
  onEdit,
  onStageChange,
  stageUpdating = false,
  onCandidateUpdated,
}) {
  const fileInputRef = useRef(null)

  // Resume section state
  const [resumeLoading,  setResumeLoading]  = useState(false)  // upload/delete in progress
  const [resumeProgress, setResumeProgress] = useState(0)       // 0-100
  const [resumeError,    setResumeError]    = useState('')
  const [resumeSuccess,  setResumeSuccess]  = useState('')
  const [confirmRemove,  setConfirmRemove]  = useState(false)   // confirm dialog

  // AI Candidate Insights state (not persisted — cleared on candidate change)
  const [aiSummary,     setAiSummary]     = useState('')
  const [aiLoading,     setAiLoading]     = useState(false)
  const [aiError,       setAiError]       = useState('')
  const [aiGeneratedAt, setAiGeneratedAt] = useState(null)

  // Reset transient feedback when drawer opens/closes or candidate changes
  useEffect(() => {
    setResumeError('')
    setResumeSuccess('')
    setResumeProgress(0)
    // Clear AI summary so a previous candidate's result never appears
    // under a different candidate's profile
    setAiSummary('')
    setAiError('')
    setAiGeneratedAt(null)
  }, [candidate?._id, open])

  // Escape key dismissal
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Resume handlers ───────────────────────────────────────

  const clearFeedback = () => { setResumeError(''); setResumeSuccess('') }

  const handleFileSelected = useCallback(async (e) => {
    const file = e.target.files?.[0]
    // Reset input so the same file can be re-selected after an error
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    // Client-side pre-validation (authoritative check is on the server)
    if (file.size === 0) {
      setResumeError('The selected file is empty.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File is too large. Maximum size is 5 MB.')
      return
    }
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are accepted.')
      return
    }

    clearFeedback()
    setResumeLoading(true)
    setResumeProgress(0)

    try {
      await uploadResume(candidate._id, file, setResumeProgress)
      setResumeSuccess('Resume uploaded successfully.')
      // Refresh candidate data so the drawer reflects the new resume metadata
      onCandidateUpdated?.(candidate._id)
    } catch (err) {
      setResumeError(err.message ?? 'Upload failed. Please try again.')
    } finally {
      setResumeLoading(false)
      setResumeProgress(0)
    }
  }, [candidate, onCandidateUpdated])

  const handleView = useCallback(async () => {
    clearFeedback()
    setResumeLoading(true)
    try {
      // The backend streams the PDF with Content-Type: application/pdf.
      // We receive it as a Blob and create a local object URL so the
      // browser can render it inline without any cross-origin cookie issues.
      const blob = await viewResumeBlob(candidate._id)
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!win) setResumeError('Pop-up blocked — please allow pop-ups for this site.')
      // Revoke after the browser has had time to read the blob
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
    } catch (err) {
      setResumeError(err.message ?? 'Could not open resume.')
    } finally {
      setResumeLoading(false)
    }
  }, [candidate])

  const handleDownload = useCallback(() => {
    // Direct anchor-click download via the Vite-proxied /api URL.
    // Because the Vite proxy makes /api same-origin, the browser sends the
    // httpOnly auth cookie automatically and uses the backend's
    //   Content-Disposition: attachment; filename="Amol_Raut_Frontend.pdf"
    // header for the saved filename — no blob URL, no revocation race, no CORS.
    const safeName = (() => {
      const raw = (candidate.resume?.fileName ?? '').trim()
      if (!raw) return 'resume.pdf'
      return raw.toLowerCase().endsWith('.pdf') ? raw : `${raw}.pdf`
    })()

    const link = document.createElement('a')
    link.href = `/api/candidates/${candidate._id}/resume?download=true`
    link.setAttribute('download', safeName) // fallback if no Content-Disposition
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [candidate])


  const handleRemoveConfirmed = useCallback(async () => {
    setConfirmRemove(false)
    clearFeedback()
    setResumeLoading(true)
    try {
      await deleteResume(candidate._id)
      setResumeSuccess('Resume removed.')
      onCandidateUpdated?.(candidate._id)
    } catch (err) {
      setResumeError(err.message ?? 'Could not remove resume.')
    } finally {
      setResumeLoading(false)
    }
  }, [candidate, onCandidateUpdated])

  // ── AI Summary handler ────────────────────────────────────

  const handleGenerateSummary = useCallback(async () => {
    if (aiLoading) return            // prevent duplicate in-flight requests
    setAiError('')
    setAiLoading(true)
    try {
      const data = await generateAiSummary(candidate._id)
      setAiSummary(data.summary)
      setAiGeneratedAt(data.generatedAt)
    } catch (err) {
      setAiError(err.message ?? 'Could not generate summary. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }, [candidate, aiLoading])

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop — restrained opacity, no blur */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/25 transition-opacity duration-200
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <aside
        role="complementary"
        aria-label="Candidate details"
        className={`fixed top-0 right-0 bottom-0 z-40 flex flex-col
                    w-full max-w-[440px] bg-white border-l border-slate-200
                    transition-transform duration-200 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {!candidate ? null : (
          <>
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div
                aria-hidden="true"
                className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center
                           text-[11px] font-bold select-none"
                style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}
              >
                {getInitials(candidate.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                  {candidate.name}
                </h2>
                <p className="text-xs text-slate-500 truncate mt-0.5">{candidate.position}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close candidate details"
                className="shrink-0 p-1.5 rounded text-slate-400 hover:text-slate-700
                           hover:bg-slate-100 transition-colors focus-visible:ring-2
                           focus-visible:ring-offset-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Hiring Stage */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">
                  Hiring Stage
                </p>
                <div className="flex items-center gap-3">
                  <span className={stageBadgeClass(candidate.stage)}>
                    {candidate.stage}
                  </span>
                  <select
                    value={candidate.stage}
                    disabled={stageUpdating}
                    onChange={(e) => onStageChange?.(candidate._id, e.target.value)}
                    aria-label="Change hiring stage"
                    className="select input-sm ml-auto w-36"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Contact
                </p>
                <InfoRow icon={Mail} label="Email">
                  <span className="break-all">{candidate.email}</span>
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  {candidate.phone || <span className="text-slate-300">Not provided</span>}
                </InfoRow>
              </div>

              {/* Professional */}
              <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Professional
                </p>
                <InfoRow icon={Briefcase} label="Experience">
                  {candidate.experience} year{candidate.experience !== 1 ? 's' : ''}
                </InfoRow>
                <InfoRow icon={Calendar} label="Applied">
                  {formatDate(candidate.appliedAt)}
                </InfoRow>
                <InfoRow icon={MapPin} label="Source">
                  {candidate.source || <span className="text-slate-300">Not specified</span>}
                </InfoRow>
              </div>

              {/* Skills */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">
                  Skills
                </p>
                {candidate.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center rounded px-2 py-0.5
                                   text-xs font-medium bg-slate-100 text-slate-600"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">No skills listed</p>
                )}
              </div>

              {/* ── Resume ──────────────────────────────────── */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Resume
                </p>

                {/* Feedback: error */}
                {resumeError && (
                  <div className="mb-3 flex items-start gap-2 rounded border border-red-100
                                  bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>{resumeError}</span>
                  </div>
                )}

                {/* Feedback: success */}
                {resumeSuccess && (
                  <div className="mb-3 rounded border border-green-100 bg-green-50
                                  px-3 py-2 text-xs text-green-700">
                    {resumeSuccess}
                  </div>
                )}

                {/* Upload progress bar */}
                {resumeLoading && resumeProgress > 0 && resumeProgress < 100 && (
                  <div className="mb-3">
                    <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${resumeProgress}%`, backgroundColor: '#1a2f54' }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{resumeProgress}% uploaded</p>
                  </div>
                )}

                {candidate.resume?.publicId ? (
                  /* ── Resume exists ──── */
                  <div className="rounded border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <FileText size={15} className="mt-0.5 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 break-all leading-snug">
                          {candidate.resume.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatBytes(candidate.resume.bytes)}
                          {candidate.resume.uploadedAt && (
                            <> · Uploaded {formatDate(candidate.resume.uploadedAt)}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {/* View inline */}
                      <button
                        onClick={handleView}
                        disabled={resumeLoading}
                        className="btn btn-secondary btn-sm gap-1"
                      >
                        {resumeLoading
                          ? <Loader2 size={12} className="animate-spin" />
                          : <ExternalLink size={12} />}
                        View
                      </button>

                      {/* Download with original filename */}
                      <button
                        onClick={handleDownload}
                        disabled={resumeLoading}
                        className="btn btn-secondary btn-sm gap-1"
                      >
                        <Download size={12} />
                        Download
                      </button>

                      {/* Replace */}
                      <button
                        onClick={() => { clearFeedback(); fileInputRef.current?.click() }}
                        disabled={resumeLoading}
                        className="btn btn-secondary btn-sm gap-1"
                      >
                        <Upload size={12} />
                        Replace
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => { clearFeedback(); setConfirmRemove(true) }}
                        disabled={resumeLoading}
                        className="btn btn-sm gap-1 text-red-500 hover:bg-red-50 hover:text-red-600
                                   border border-transparent hover:border-red-100 transition-colors"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── No resume ─────── */
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">No resume uploaded yet.</p>
                    <button
                      onClick={() => { clearFeedback(); fileInputRef.current?.click() }}
                      disabled={resumeLoading}
                      className="btn btn-secondary btn-sm gap-1 shrink-0"
                    >
                      {resumeLoading
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Upload size={12} />}
                      Upload Resume
                    </button>
                  </div>
                )}

                {/* Hidden file input — triggered by styled buttons above */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={handleFileSelected}
                />
              </div>

              {/* Notes — only shown when non-empty */}
              {candidate.notes && (
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">
                    Notes
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {candidate.notes}
                  </p>
                </div>
              )}

              {/* ── AI Candidate Insights ──────────────────── */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles size={10} className="text-indigo-400" />
                  AI Candidate Insights
                </p>

                {/* Initial state — prompt to generate */}
                {!aiSummary && !aiLoading && !aiError && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      Generate a concise professional summary based on this
                      candidate&rsquo;s profile. Summary is not stored and
                      disappears when the drawer closes.
                    </p>
                    <button
                      id="ai-generate-summary-btn"
                      onClick={handleGenerateSummary}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 bg-indigo-600 text-white text-xs font-medium
                                 hover:bg-indigo-700 active:bg-indigo-800
                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={12} />
                      Generate AI Summary
                    </button>
                  </div>
                )}

                {/* Loading */}
                {aiLoading && (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={14} className="animate-spin text-indigo-500 shrink-0" />
                    <span className="text-xs text-slate-500">Generating summary&hellip;</span>
                  </div>
                )}

                {/* Error */}
                {aiError && !aiLoading && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3.5">
                    <div className="flex items-start gap-2 mb-2.5">
                      <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                      <p className="text-xs text-red-600 leading-relaxed">{aiError}</p>
                    </div>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                 border border-slate-200 bg-white text-xs font-medium text-slate-600
                                 hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw size={11} />
                      Try Again
                    </button>
                  </div>
                )}

                {/* Generated summary */}
                {aiSummary && !aiLoading && (
                  <div className="rounded-xl border border-indigo-100
                                  bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-3.5">
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                      {aiSummary}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                        <Sparkles size={9} />
                        <span>
                          AI&#8209;generated
                          {aiGeneratedAt ? ` · ${new Date(aiGeneratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                      </div>
                      <button
                        id="ai-regenerate-summary-btn"
                        onClick={handleGenerateSummary}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                   border border-slate-200 bg-white text-[11px] font-medium text-slate-600
                                   hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={11} />
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex items-center gap-2.5">
              <button
                id="detail-edit-btn"
                onClick={() => onEdit?.(candidate)}
                className="btn btn-secondary gap-1.5"
              >
                <Pencil size={13} />
                Edit candidate
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Confirm remove resume dialog */}
      <ConfirmDialog
        open={confirmRemove}
        title="Remove Resume"
        message={`Remove the resume for ${candidate?.name ?? 'this candidate'}? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  )
}

/* ── InfoRow helper ─────────────────────────────────────── */
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true">
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">{label}</p>
        <div className="text-sm text-slate-700">{children}</div>
      </div>
    </div>
  )
}

/* ── formatBytes ─────────────────────────────────────────── */
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024)          return `${bytes} B`
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
