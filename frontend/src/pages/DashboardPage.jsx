import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, Briefcase, CalendarCheck, UserPlus, AlertCircle, Loader2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ArrowRight } from 'lucide-react'
import MetricCard from '../components/MetricCard.jsx'
import StageBadge from '../components/StageBadge.jsx'
import CandidateModal from '../components/candidates/CandidateModal.jsx'
import { getDashboardStats } from '../services/candidateService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../lib/utils.js'

// ── Stage chart colors ─────────────────────────────────────
const STAGE_COLORS = {
  Applied:   '#64748b',
  Screening: '#3b82f6',
  Interview: '#8b5cf6',
  Offer:     '#f59e0b',
  Hired:     '#10b981',
  Rejected:  '#ef4444',
}

// ── Custom tooltips ────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs shadow-dropdown">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-500">Candidates: <span className="font-bold text-slate-800">{payload[0].value}</span></p>
    </div>
  )
}

function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs shadow-dropdown space-y-1">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}</span>
          <span className="font-semibold text-slate-800 ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ name }) {
  const init = (name ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  return (
    <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 select-none text-[11px] font-bold"
         style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}>
      {init}
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { recruiter } = useAuth()
  const firstName = recruiter?.name?.split(' ')[0] ?? 'there'

  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const metrics = stats ? [
    {
      id: 'total',
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: <Users size={16} />,
      sub: stats.totalCandidates === 1 ? '1 in system' : `${stats.totalCandidates} in system`,
      intent: 'default',
    },
    {
      id: 'active',
      title: 'Active',
      value: stats.activeCandidates,
      icon: <UserCheck size={16} />,
      sub: 'In active stages',
      intent: 'info',
    },
    {
      id: 'hired',
      title: 'Hired This Month',
      value: stats.hiredThisMonth,
      icon: <Briefcase size={16} />,
      sub: 'Applied this month',
      intent: 'positive',
    },
    {
      id: 'interviews',
      title: 'Interviews',
      value: stats.interviewsScheduled,
      icon: <CalendarCheck size={16} />,
      sub: 'In Interview stage',
      intent: 'default',
    },
  ] : []

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">{todayLabel()}</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
            {greeting()}, {firstName}.
          </h1>
          <p className="text-sm text-slate-500 mt-2">Here's your recruiting overview.</p>
        </div>
        <button id="dashboard-add-candidate-btn" onClick={() => setModalOpen(true)}
                className="btn shrink-0 mt-1" style={{ backgroundColor: '#1a2f54', color: 'white' }}>
          <UserPlus size={14} />
          Add Candidate
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 mb-6 p-4 text-sm text-red-700 border border-red-200 rounded-md bg-red-50">
          <AlertCircle size={15} className="shrink-0" />
          {error}
          <button onClick={fetchStats} className="ml-auto underline font-medium hover:no-underline">Retry</button>
        </div>
      )}

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          {[0,1,2,3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-md shadow-card p-5 h-28 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
          {metrics.map((m) => <MetricCard key={m.id} {...m} />)}
        </div>
      )}

      {/* Charts */}
      {!loading && stats && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 mb-5">
          {/* Stage distribution — primary (3/5) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md shadow-card p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pipeline Distribution</p>
                <p className="text-xs text-slate-400 mt-0.5">Candidates by hiring stage</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 leading-none tabular-nums">
                  {stats.totalCandidates}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">total</p>
              </div>
            </div>
            {stats.totalCandidates === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <p className="text-sm text-slate-400">No candidates yet</p>
                <button onClick={() => navigate('/candidates')}
                        className="text-xs font-medium underline hover:no-underline"
                        style={{ color: '#1a2f54' }}>
                  Add your first candidate
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stats.stageDistribution}
                          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                          barCategoryGap="30%">
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#6b7a8d' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9aa4b2' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8f9fb' }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {stats.stageDistribution.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stage breakdown table — secondary (2/5) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-card p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Stage Breakdown</p>
              <p className="text-xs text-slate-400 mt-0.5">Count per stage</p>
            </div>
            {stats.totalCandidates === 0 ? (
              <div className="flex items-center justify-center flex-1 h-40">
                <p className="text-sm text-slate-400">No data yet</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {stats.stageDistribution.map(({ stage, count }) => {
                  const pct = stats.totalCandidates > 0 ? Math.round((count / stats.totalCandidates) * 100) : 0
                  const color = STAGE_COLORS[stage] ?? '#94a3b8'
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{stage}</span>
                        <span className="text-slate-400 tabular-nums">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent candidates */}
      {!loading && stats && (
        <div className="bg-white border border-slate-200 rounded-md shadow-card">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Recent Candidates</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest {stats.recentCandidates.length} applicants
              </p>
            </div>
            <button onClick={() => navigate('/candidates')}
                    className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                    style={{ color: '#223f72' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          {stats.recentCandidates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No candidates yet.</p>
              <button onClick={() => navigate('/candidates')}
                      className="mt-2 text-xs font-medium underline hover:no-underline"
                      style={{ color: '#1a2f54' }}>
                Add your first candidate
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Position</th>
                    <th>Stage</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCandidates.map((c) => (
                    <tr key={c._id} className="cursor-pointer" onClick={() => navigate('/candidates')}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} />
                          <div>
                            <p className="font-medium text-slate-800 text-sm leading-none">{c.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600 text-sm">{c.position}</td>
                      <td><StageBadge stage={c.stage} /></td>
                      <td className="text-slate-400 tabular-nums text-xs">{formatDate(c.appliedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Candidate modal — opened from the header button */}
      <CandidateModal
        open={modalOpen}
        candidate={null}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); navigate('/candidates') }}
      />
    </div>
  )
}
