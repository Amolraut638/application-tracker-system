import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockApplicationTrend } from '../../lib/mockData.js'

const CustomTooltip = ({ active, payload, label }) => {
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

// Legend items rendered manually for precise control
const LEGEND = [
  { key: 'applications', label: 'Applications', color: '#1a2f54' },
  { key: 'hired',        label: 'Hired',        color: '#0d9488' },
]

export default function ApplicationTrendChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Application Trend</p>
          <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
        </div>
        {/* Manual legend */}
        <div className="flex items-center gap-3">
          {LEGEND.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart
          data={mockApplicationTrend}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1a2f54" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#1a2f54" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHired" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="applications"
            stroke="#1a2f54"
            strokeWidth={2}
            fill="url(#gradApps)"
            dot={false}
            activeDot={{ r: 4, fill: '#1a2f54' }}
          />
          <Area
            type="monotone"
            dataKey="hired"
            stroke="#0d9488"
            strokeWidth={2}
            fill="url(#gradHired)"
            dot={false}
            activeDot={{ r: 4, fill: '#0d9488' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
