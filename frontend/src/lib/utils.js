/**
 * Utility helpers shared across the application.
 */

/** Format a date string (YYYY-MM-DD) to a short human-readable format. */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/** Returns Tailwind badge class for a given hiring stage. */
export function stageBadgeClass(stage) {
  const map = {
    Applied:   'badge-applied',
    Screening: 'badge-screening',
    Interview: 'badge-interview',
    Offer:     'badge-offer',
    Hired:     'badge-hired',
    Rejected:  'badge-rejected',
  }
  return map[stage] ?? 'badge-applied'
}

/** Returns a hex color for Recharts per stage. */
export function stageColor(stage) {
  const map = {
    Applied:   '#94a3b8', // slate-400
    Screening: '#60a5fa', // blue-400
    Interview: '#c084fc', // purple-400
    Offer:     '#fbbf24', // amber-400
    Hired:     '#4ade80', // green-400
    Rejected:  '#f87171', // red-400
  }
  return map[stage] ?? '#94a3b8'
}

/** Returns initials from a full name string. */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
