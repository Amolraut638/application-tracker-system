import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, UserPlus, ChevronUp, ChevronDown, Pencil, Trash2, Eye, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import StageBadge from '../components/StageBadge.jsx'
import CandidateModal from '../components/candidates/CandidateModal.jsx'
import CandidateDetailDrawer from '../components/candidates/CandidateDetailDrawer.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { getCandidates, getCandidate, deleteCandidate, updateStage } from '../services/candidateService.js'
import { formatDate } from '../lib/utils.js'

const STAGES    = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']
const POSITIONS = [
  'Frontend Engineer', 'Backend Engineer', 'Product Designer',
  'Product Manager', 'Data Analyst', 'DevOps Engineer', 'QA Engineer',
]

function CandidateAvatar({ name }) {
  const init = (name ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 select-none text-[11px] font-bold"
         style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}>
      {init}
    </div>
  )
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronUp size={11} className="text-slate-300" />
  return sortDir === 'asc'
    ? <ChevronUp   size={11} style={{ color: '#1a2f54' }} />
    : <ChevronDown size={11} style={{ color: '#1a2f54' }} />
}

export default function CandidatesPage() {
  // ── Filter / sort state ───────────────────────────────
  const [search,    setSearch]    = useState('')
  const [stageFilter, setStage]   = useState('')
  const [posFilter,   setPos]     = useState('')
  const [sortKey,   setSortKey]   = useState('appliedAt')
  const [sortDir,   setSortDir]   = useState('desc')
  const [page,      setPage]      = useState(1)

  // ── Data state ────────────────────────────────────────
  const [candidates,  setCandidates]  = useState([])
  const [pagination,  setPagination]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // ── UI state ──────────────────────────────────────────
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)   // candidate to edit
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerTarget,  setDrawerTarget]  = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [stageUpdating, setStageUpdating] = useState(false)

  // Debounce search so we don't fire on every keystroke
  const searchTimer = useRef(null)
  const [debouncedSearch, setDebounced] = useState('')

  function handleSearchChange(e) {
    setSearch(e.target.value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebounced(e.target.value)
      setPage(1)
    }, 350)
  }

  // ── Fetch candidates ──────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        limit: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(stageFilter      && { stage: stageFilter }),
        ...(posFilter         && { position: posFilter }),
      }
      const res = await getCandidates(params)
      // Client-side sort (server returns appliedAt: -1 by default)
      const sorted = [...(res.data ?? [])].sort((a, b) => {
        let av = a[sortKey] ?? ''
        let bv = b[sortKey] ?? ''
        if (sortKey === 'appliedAt') { av = new Date(av); bv = new Date(bv) }
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ?  1 : -1
        return 0
      })
      setCandidates(sorted)
      setPagination(res.pagination)
    } catch (err) {
      setError(err.message ?? 'Failed to load candidates.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, stageFilter, posFilter, sortKey, sortDir])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  // ── Sorting ───────────────────────────────────────────
  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Filters ───────────────────────────────────────────
  const hasFilters = debouncedSearch || stageFilter || posFilter
  function clearFilters() {
    setSearch(''); setDebounced(''); setStage(''); setPos(''); setPage(1)
  }

  // ── Add candidate ─────────────────────────────────────
  function openAddModal() {
    setEditTarget(null)
    setModalOpen(true)
  }

  // ── Edit candidate ────────────────────────────────────
  function openEditModal(c) {
    setEditTarget(c)
    setModalOpen(true)
    setDrawerOpen(false)
  }

  // ── View details ──────────────────────────────────────
  function openDrawer(c) {
    setDrawerTarget(c)
    setDrawerOpen(true)
  }

  // ── Stage change (from drawer) ────────────────────────
  async function handleStageChange(id, newStage) {
    setStageUpdating(true)
    const prev = drawerTarget
    // Optimistic update
    setDrawerTarget((d) => d ? { ...d, stage: newStage } : d)
    setCandidates((cs) => cs.map((c) => c._id === id ? { ...c, stage: newStage } : c))
    try {
      const updated = await updateStage(id, newStage)
      setCandidates((cs) => cs.map((c) => c._id === id ? updated : c))
      setDrawerTarget(updated)
      toast.success(`Stage updated to ${newStage}.`)
    } catch (err) {
      // Rollback
      setDrawerTarget(prev)
      setCandidates((cs) => cs.map((c) => c._id === id ? prev : c))
      toast.error(err.message ?? 'Stage update failed.')
    } finally {
      setStageUpdating(false)
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
      fetchCandidates()
    } catch (err) {
      toast.error(err.message ?? 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  // ── After save ────────────────────────────────────────
  function handleSaved() {
    fetchCandidates()
  }

  // ── After resume upload/delete — refresh single candidate ─
  async function handleCandidateUpdated(id) {
    try {
      const updated = await getCandidate(id)
      // Update the drawer target so resume section reflects new state
      setDrawerTarget(updated)
      // Update the row in the table as well
      setCandidates((cs) => cs.map((c) => c._id === id ? updated : c))
    } catch {
      // Non-critical — worst case the drawer just shows stale data until refresh
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Candidates</h1>
          <p className="text-sm text-slate-500 mt-2">
            {pagination ? `${pagination.total} applicant${pagination.total !== 1 ? 's' : ''} in your pipeline` : 'Loading…'}
          </p>
        </div>
        <button id="candidates-add-btn" onClick={openAddModal} className="btn shrink-0 mt-1"
                style={{ backgroundColor: '#1a2f54', color: 'white' }}>
          <UserPlus size={14} />
          Add Candidate
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-md shadow-card p-3 mb-4 flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="candidates-search"
            type="search"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={handleSearchChange}
            className="input input-sm pl-8"
          />
        </div>
        <select id="candidates-stage-filter" value={stageFilter}
                onChange={(e) => { setStage(e.target.value); setPage(1) }}
                className="select input-sm w-32">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select id="candidates-position-filter" value={posFilter}
                onChange={(e) => { setPos(e.target.value); setPage(1) }}
                className="select input-sm w-44">
          <option value="">All positions</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost btn-sm">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-slate-400 font-medium whitespace-nowrap">
          {candidates.length} shown
        </span>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-md shadow-card overflow-hidden">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 text-sm text-red-700 border-b border-red-100 bg-red-50">
            <AlertCircle size={15} className="shrink-0" />
            {error}
            <button onClick={fetchCandidates} className="ml-auto underline font-medium hover:no-underline">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button className="flex items-center gap-1 hover:text-slate-600" onClick={() => handleSort('name')}>
                    Candidate <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:text-slate-600" onClick={() => handleSort('position')}>
                    Position <SortIcon col="position" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className="flex items-center gap-1 hover:text-slate-600" onClick={() => handleSort('experience')}>
                    Exp <SortIcon col="experience" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th>Stage</th>
                <th>
                  <button className="flex items-center gap-1 hover:text-slate-600" onClick={() => handleSort('appliedAt')}>
                    Applied <SortIcon col="appliedAt" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={22} className="animate-spin text-slate-300" />
                      <p className="text-sm text-slate-400">Loading candidates…</p>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    <div className="empty-state">
                      <Search size={28} className="text-slate-200" />
                      <p className="empty-state-title">
                        {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
                      </p>
                      <p className="empty-state-description">
                        {hasFilters
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Add your first candidate to get started.'}
                      </p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="btn-secondary btn-sm mt-2">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c._id} className="cursor-pointer" onClick={() => openDrawer(c)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <CandidateAvatar name={c.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm leading-none">{c.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-600">{c.position}</td>
                    <td className="text-sm text-slate-600 tabular-nums">
                      {c.experience}y
                    </td>
                    <td><StageBadge stage={c.stage} /></td>
                    <td className="text-xs text-slate-400 tabular-nums whitespace-nowrap">{formatDate(c.appliedAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button title="View details" onClick={() => openDrawer(c)}
                                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          <Eye size={13} />
                        </button>
                        <button title="Edit" onClick={() => openEditModal(c)}
                                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button title="Delete" onClick={() => setDeleteTarget(c)}
                                className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} — {pagination.total} total
            </span>
            <div className="flex gap-1.5">
              <button className="btn-secondary btn-sm" disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </button>
              <button className="btn-secondary btn-sm" disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals / Drawers */}
      <CandidateModal
        open={modalOpen}
        candidate={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <CandidateDetailDrawer
        open={drawerOpen}
        candidate={drawerTarget}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEditModal}
        onStageChange={handleStageChange}
        stageUpdating={stageUpdating}
        onCandidateUpdated={handleCandidateUpdated}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete candidate"
        message={`Are you sure you want to delete ${deleteTarget?.name ?? 'this candidate'}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
