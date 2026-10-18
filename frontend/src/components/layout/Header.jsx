import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'RC'
}

export default function Header({ onMenuClick }) {
  const { recruiter } = useAuth()

  return (
    <header className="h-[53px] shrink-0 flex items-center justify-between px-5 bg-white border-b border-slate-200">
      {/* Left — mobile menu toggle only; page title now lives on each page */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={17} />
        </button>

        {/* HireFlow wordmark on mobile (hidden on desktop where sidebar is visible) */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded"
               style={{ backgroundColor: '#0f1e36' }}>
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V5.5L7 2l5 3.5V12H9V8.5H5V12H2Z" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">HireFlow</span>
        </div>
      </div>

      {/* Right — recruiter identity */}
      <div className="flex items-center gap-3">
        {recruiter && (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-700 leading-none">
                {recruiter.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none truncate max-w-[160px]">
                {recruiter.email}
              </p>
            </div>
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 select-none text-[11px] font-bold"
              style={{ backgroundColor: '#1a2f54', color: 'rgba(255,255,255,0.9)' }}
              title={recruiter?.email ?? 'Recruiter'}
            >
              {initials(recruiter.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
