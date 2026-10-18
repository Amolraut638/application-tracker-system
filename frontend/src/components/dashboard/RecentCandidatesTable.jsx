import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getRecentCandidates } from '../../lib/mockData.js'
import { formatDate } from '../../lib/utils.js'
import StageBadge from '../StageBadge.jsx'

const recent = getRecentCandidates(6)

function CandidateAvatar({ name }) {
  const init = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  return (
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 select-none text-[11px] font-bold"
      style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}
    >
      {init}
    </div>
  )
}

export default function RecentCandidatesTable() {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-card">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">Recent Candidates</p>
          <p className="text-xs text-slate-400 mt-0.5">Latest {recent.length} applicants</p>
        </div>
        <button
          onClick={() => navigate('/candidates')}
          className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 transition-colors"
          style={{ color: '#223f72' }}
        >
          View all
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Table */}
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
            {recent.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer"
                onClick={() => navigate('/candidates')}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <CandidateAvatar name={c.name} />
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
    </div>
  )
}
