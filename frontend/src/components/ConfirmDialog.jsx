import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * ConfirmDialog — accessible confirmation modal.
 *
 * Props:
 *   open        boolean
 *   title       string
 *   message     string
 *   confirmLabel string  default "Confirm"
 *   danger       boolean  — makes confirm button red
 *   onConfirm   () => void
 *   onCancel    () => void
 *   loading     boolean
 */
export default function ConfirmDialog({
  open,
  title       = 'Are you sure?',
  message     = '',
  confirmLabel = 'Confirm',
  danger       = false,
  onConfirm,
  onCancel,
  loading      = false,
}) {
  const cancelRef = useRef(null)

  // Focus cancel button when opened
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {message && (
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
        )}

        <div className="flex gap-2.5 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            id="confirm-dialog-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
            className="btn"
            style={{
              backgroundColor: danger ? '#dc2626' : '#1a2f54',
              color: 'white',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
