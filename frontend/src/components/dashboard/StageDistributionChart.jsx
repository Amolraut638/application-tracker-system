import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { mockStageDistribution } from '../../lib/mockData.js'

// Muted, professional stage colors — no saturated rainbow
const STAGE_COLORS = {
  Applied:   '#64748b', // slate
  Screening: '#3b82f6', // blue
  Interview: '#8b5cf6', // violet
  Offer:     '#f59e0b', // amber
  Hired:     '#10b981', // emerald
  Rejected:  '#ef4444', // red — slightly muted
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs shadow-dropdown">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-500">
        Candidates:{' '}
        <span className="font-bold text-slate-800">{payload[0].value}</span>
      </p>
    </div>
  )
}

export default function StageDistributionChart() {
  const total = mockStageDistribution.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Pipeline Distribution</p>
          <p className="text-xs text-slate-400 mt-0.5">Candidates by hiring stage</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900 leading-none tabular-nums">{total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">total</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={mockStageDistribution}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          barCategoryGap="30%"
        >
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 11, fill: '#6b7a8d' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9aa4b2' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fb' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {mockStageDistribution.map((entry) => (
              <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
