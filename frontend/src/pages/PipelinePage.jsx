import { useState, useEffect, useCallback } from 'react'
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import StageBadge from '../components/StageBadge.jsx'
import CandidateModal from '../components/candidates/CandidateModal.jsx'
import CandidateDetailDrawer from '../components/candidates/CandidateDetailDrawer.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { getCandidates, updateStage, deleteCandidate } from '../services/candidateService.js'
import { formatDate } from '../lib/utils.js'

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']

// Stage column accent colors (left border only)
const STAGE_META = {
  Applied:   { border: '#94a3b8', dot: '#64748b', label: 'text-slate-600'   },
  Screening: { border: '#3b82f6', dot: '#2563eb', label: 'text-blue-700'    },
  Interview: { border: '#8b5cf6', dot: '#7c3aed', label: 'text-violet-700'  },
  Offer:     { border: '#f59e0b', dot: '#d97706', label: 'text-amber-700'   },
  Hired:     { border: '#10b981', dot: '#059669', label: 'text-emerald-700' },
  Rejected:  { border: '#ef4444', dot: '#dc2626', label: 'text-red-600'     },
}

function Avatar({ name }) {
  const init = (name ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 select-none text-[11px] font-bold"
         style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}>
      {init}
    </div>
  )
}

function PipelineCard({ candidate, onClick, onStageChange, stageUpdatingId }) {
  const isUpdating = stageUpdatingId === candidate._id

  return (
    <div
      className="bg-white border border-slate-200 rounded shadow-card p-3 space-y-2
                 hover:border-slate-300 hover:shadow-card-md transition-all duration-100 cursor-pointer"
      onClick={() => onClick(candidate)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={candidate.name} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 truncate leading-none">{candidate.name}</p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{candidate.position}</p>
        </div>
      </div>

      {/* Experience + skills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-500 font-medium tabular-nums">{candidate.experience}y exp</span>
        {candidate.skills?.slice(0, 2).map((sk) => (
          <span key={sk} className="inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium bg-slate-100 text-slate-600">
            {sk}
          </span>
        ))}
      </div>

      {/* Stage change dropdown (stop propagation so card click doesn't fire) */}
      <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
        <select
          value={candidate.stage}
          disabled={isUpdating}
          onChange={(e) => onStageChange(candidate._id, e.target.value, candidate)}
          className="select w-full text-[10px] py-1 px-2 bg-slate-50"
          aria-label={`Change stage for ${candidate.name}`}
        >
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}

function StageColumn({ stage, candidates, onCardClick, onStageChange, stageUpdatingId }) {
  const meta = STAGE_META[stage]
  return (
    <div className="flex flex-col w-52 shrink-0">
      {/* Column header */}
      <div className="bg-white border border-slate-200 rounded mb-2 px-3 py-2.5 flex items-center gap-2 shadow-card"
           style={{ borderLeft: `3px solid ${meta.border}` }}>
        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
        <span className={`text-xs font-semibold ${meta.label} flex-1 truncate`}>{stage}</span>
        <span className="text-xs font-bold text-slate-400 tabular-nums ml-auto">{candidates.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {candidates.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded px-3 py-5 text-center">
            <p className="text-[11px] text-slate-300 font-medium">Empty</p>
          </div>
        ) : (
          candidates.map((c) => (
            <PipelineCard key={c._id} candidate={c}
                          onClick={onCardClick}
                          onStageChange={onStageChange}
                          stageUpdatingId={stageUpdatingId} />
          ))
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [candidates,    setCandidates]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [stageUpdatingId, setStageUpdating] = useState(null)

  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerTarget,  setDrawerTarget]  = useState(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch all candidates without pagination for pipeline view
      const res = await getCandidates({ limit: 200 })
      setCandidates(res.data ?? [])
    } catch (err) {
      setError(err.message ?? 'Failed to load pipeline.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Stage change ──────────────────────────────────────
  async function handleStageChange(id, newStage, candidate) {
    const prev = candidate.stage
    setStageUpdating(id)
    // Optimistic
    setCandidates((cs) => cs.map((c) => c._id === id ? { ...c, stage: newStage } : c))
    if (drawerTarget?._id === id) setDrawerTarget((d) => d ? { ...d, stage: newStage } : d)
    try {
      const updated = await updateStage(id, newStage)
      setCandidates((cs) => cs.map((c) => c._id === id ? updated : c))
      if (drawerTarget?._id === id) setDrawerTarget(updated)
      toast.success(`${candidate.name} moved to ${newStage}.`)
    } catch (err) {
      // Rollback
      setCandidates((cs) => cs.map((c) => c._id === id ? { ...c, stage: prev } : c))
      if (drawerTarget?._id === id) setDrawerTarget((d) => d ? { ...d, stage: prev } : d)
      toast.error(err.message ?? 'Stage update failed.')
    } finally {
      setStageUpdating(null)
    }
  }

  // ── Delete ────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCandidate(deleteTarget._id)
      toast.success(`${deleteTarget.name} deleted.`)
      setDeleteTarget(null)
      if (drawerTarget?._id === deleteTarget._id) setDrawerOpen(false)
      fetchAll()
    } catch (err) {
      toast.error(err.message ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const totalActive = candidates.filter((c) => !['Hired', 'Rejected'].includes(c.stage)).length

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Pipeline</h1>
          <p className="text-sm text-slate-500 mt-2">
            {loading ? 'Loading…' : `${totalActive} active candidate${totalActive !== 1 ? 's' : ''} across ${STAGES.length - 1} stages`}
          </p>
        </div>
        <button id="pipeline-add-btn"
                onClick={() => { setEditTarget(null); setModalOpen(true) }}
                className="btn shrink-0 mt-1"
                style={{ backgroundColor: '#1a2f54', color: 'white' }}>
          <UserPlus size={14} />
          Add Candidate
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 mb-5 p-4 text-sm text-red-700 border border-red-200 rounded-md bg-red-50">
          <AlertCircle size={15} className="shrink-0" />
          {error}
          <button onClick={fetchAll} className="ml-auto underline font-medium hover:no-underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={28} className="animate-spin text-slate-300" />
          <p className="text-sm text-slate-400">Loading pipeline…</p>
        </div>
      ) : (
        /* Board */
        <div className="overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hidden">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                candidates={candidates.filter((c) => c.stage === stage)}
                onCardClick={(c) => { setDrawerTarget(c); setDrawerOpen(true) }}
                onStageChange={handleStageChange}
                stageUpdatingId={stageUpdatingId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drawers / Modals */}
      <CandidateDetailDrawer
        open={drawerOpen}
        candidate={drawerTarget}
        onClose={() => setDrawerOpen(false)}
        onEdit={(c) => { setEditTarget(c); setModalOpen(true); setDrawerOpen(false) }}
        onStageChange={(id, stage) => handleStageChange(id, stage, drawerTarget)}
        stageUpdating={Boolean(stageUpdatingId)}
      />

      <CandidateModal
        open={modalOpen}
        candidate={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchAll()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete candidate"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
