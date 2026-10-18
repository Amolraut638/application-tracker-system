import { useState, useEffect, useRef } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { createCandidate, updateCandidate } from '../../services/candidateService.js'
import StageBadge from '../StageBadge.jsx'

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']
const SOURCES = ['LinkedIn', 'Referral', 'Company Website', 'Job Board', 'AngelList',
                 'University Job Fair', 'Recruiter Outreach', 'Other']

const EMPTY = {
  name: '', email: '', phone: '', position: '',
  experience: '', skills: '', stage: 'Applied',
  source: '', appliedAt: '', notes: '',
}

function fieldError(errors, field) {
  return errors[field]
    ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    : null
}

/**
 * CandidateModal — reusable create / edit form.
 *
 * Props:
 *   open       boolean
 *   candidate  object | null  — null for create, existing doc for edit
 *   onClose    () => void
 *   onSaved    (candidate) => void
 */
export default function CandidateModal({ open, candidate, onClose, onSaved }) {
  const [form, setForm]       = useState(EMPTY)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [serverErr, setServer] = useState('')
  const firstRef = useRef(null)
  const isEdit = Boolean(candidate?._id)

  // Pre-fill when editing
  useEffect(() => {
    if (!open) return
    if (candidate) {
      setForm({
        name:       candidate.name ?? '',
        email:      candidate.email ?? '',
        phone:      candidate.phone ?? '',
        position:   candidate.position ?? '',
        experience: candidate.experience ?? '',
        skills:     Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '',
        stage:      candidate.stage ?? 'Applied',
        source:     candidate.source ?? '',
        appliedAt:  candidate.appliedAt ? candidate.appliedAt.slice(0, 10) : '',
        notes:      candidate.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setServer('')
    setTimeout(() => firstRef.current?.focus(), 60)
  }, [open, candidate])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '' }))
    setServer('')
  }

  // ── Validate ───────────────────────────────────────────
  function validate() {
    const e = {}
    if (!form.name.trim())     e.name     = 'Name is required.'
    if (!form.email.trim())    e.email    = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.position.trim()) e.position = 'Position is required.'
    if (form.experience === '' || form.experience === null) {
      e.experience = 'Experience is required.'
    } else if (Number(form.experience) < 0) {
      e.experience = 'Experience cannot be negative.'
    }
    return e
  }

  // ── Submit ─────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      name:       form.name.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      position:   form.position.trim(),
      experience: Number(form.experience),
      skills:     form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      stage:      form.stage,
      source:     form.source,
      appliedAt:  form.appliedAt || undefined,
      notes:      form.notes.trim(),
    }

    setSaving(true)
    setServer('')
    try {
      const saved = isEdit
        ? await updateCandidate(candidate._id, payload)
        : await createCandidate(payload)
      toast.success(isEdit ? 'Candidate updated.' : 'Candidate added successfully.')
      onSaved(saved)
      onClose()
    } catch (err) {
      setServer(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
           onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-white rounded-lg border border-slate-200 shadow-xl
                      w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* Server error */}
          {serverErr && (
            <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5Zm0 7a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 12Z"/>
              </svg>
              {serverErr}
            </div>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-name" className="field-label">Full name <span className="text-red-500">*</span></label>
              <input ref={firstRef} id="cf-name" className={`input ${errors.name ? 'input-error' : ''}`}
                     value={form.name} onChange={set('name')} placeholder="Jane Smith" />
              {fieldError(errors, 'name')}
            </div>
            <div>
              <label htmlFor="cf-email" className="field-label">Email <span className="text-red-500">*</span></label>
              <input id="cf-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                     value={form.email} onChange={set('email')} placeholder="jane@example.com" />
              {fieldError(errors, 'email')}
            </div>
          </div>

          {/* Phone + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-phone" className="field-label">Phone</label>
              <input id="cf-phone" type="tel" className="input"
                     value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label htmlFor="cf-position" className="field-label">Position <span className="text-red-500">*</span></label>
              <input id="cf-position" className={`input ${errors.position ? 'input-error' : ''}`}
                     value={form.position} onChange={set('position')} placeholder="Frontend Engineer" />
              {fieldError(errors, 'position')}
            </div>
          </div>

          {/* Experience + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-experience" className="field-label">Experience (yrs) <span className="text-red-500">*</span></label>
              <input id="cf-experience" type="number" min="0" step="0.5" className={`input ${errors.experience ? 'input-error' : ''}`}
                     value={form.experience} onChange={set('experience')} placeholder="0" />
              {fieldError(errors, 'experience')}
            </div>
            <div>
              <label htmlFor="cf-stage" className="field-label">Stage</label>
              <select id="cf-stage" className="select" value={form.stage} onChange={set('stage')}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="cf-skills" className="field-label">
              Skills
              <span className="ml-1.5 font-normal text-slate-400 normal-case tracking-normal">
                comma-separated
              </span>
            </label>
            <input id="cf-skills" className="input"
                   value={form.skills} onChange={set('skills')}
                   placeholder="React, TypeScript, Node.js" />
          </div>

          {/* Source + Applied date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-source" className="field-label">Source</label>
              <select id="cf-source" className="select" value={form.source} onChange={set('source')}>
                <option value="">Select source…</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cf-applied" className="field-label">Applied date</label>
              <input id="cf-applied" type="date" className="input"
                     value={form.appliedAt} onChange={set('appliedAt')} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="cf-notes" className="field-label">Notes</label>
            <textarea id="cf-notes" rows={3} className="input resize-none"
                      value={form.notes} onChange={set('notes')}
                      placeholder="Any relevant notes about this candidate…" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button id="candidate-modal-submit" type="submit" disabled={saving}
                    className="btn" style={{ backgroundColor: '#1a2f54', color: 'white' }}>
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEdit ? 'Saving…' : 'Adding…'}
                </span>
              ) : isEdit ? 'Save changes' : 'Add candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
