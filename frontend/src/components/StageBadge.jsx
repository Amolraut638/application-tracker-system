import { stageBadgeClass } from '../lib/utils.js'

/**
 * StageBadge — renders a styled pill for a hiring stage.
 *
 * Props:
 *   stage  string  — one of Applied | Screening | Interview | Offer | Hired | Rejected
 */
export default function StageBadge({ stage }) {
  return (
    <span className={stageBadgeClass(stage)}>
      {stage}
    </span>
  )
}
