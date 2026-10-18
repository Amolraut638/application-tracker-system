import clsx from 'clsx'

/**
 * MetricCard — KPI summary card.
 *
 * Props:
 *   title   string
 *   value   string | number
 *   icon    ReactNode
 *   sub     string         — optional supporting text below value
 *   intent  'default' | 'positive' | 'negative' | 'info'
 */
export default function MetricCard({ title, value, icon, sub, intent = 'default' }) {
  const iconStyle = {
    positive: { bg: '#f0fdf4', color: '#16a34a' },
    negative: { bg: '#fef2f2', color: '#dc2626' },
    info:     { bg: '#eff6ff', color: '#2563eb' },
    default:  { bg: '#f1f3f7', color: '#4f5d6e' },
  }[intent]

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-card p-5 flex flex-col gap-4">
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          {title}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded"
          style={{ backgroundColor: iconStyle.bg, color: iconStyle.color }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums tracking-tight">
          {value}
        </span>
        {sub && (
          <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>
        )}
      </div>
    </div>
  )
}
