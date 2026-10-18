import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GitPullRequestArrow, X, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/pipeline',   label: 'Pipeline',   icon: GitPullRequestArrow },
]

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'RC'
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { recruiter, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully.')
      navigate('/login', { replace: true })
    } catch {
      toast.error('Sign-out failed. Please try again.')
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-navy-950/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — deep navy */}
      <aside
        style={{ backgroundColor: '#0f1e36' }}
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-52 flex-col',
          'border-r border-white/[0.06]',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── Brand ──────────────────────────────────────── */}
        <div className="flex items-center justify-between h-[53px] px-4 shrink-0"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded"
                 style={{ backgroundColor: '#2d5494' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 12V5.5L7 2l5 3.5V12H9V8.5H5V12H2Z" fill="white" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight"
                    style={{ color: 'rgba(255,255,255,0.95)' }}>
                HireFlow
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Close navigation"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.12em]"
             style={{ color: 'rgba(255,255,255,0.28)' }}>
            Workspace
          </p>

          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-all duration-100',
                    isActive
                      ? 'font-medium'
                      : 'font-normal',
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.95)',
                      }
                    : {
                        color: 'rgba(255,255,255,0.55)',
                      }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={14}
                      strokeWidth={isActive ? 2.25 : 1.75}
                      style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── Recruiter footer ────────────────────────────── */}
        <div className="px-3 py-3 shrink-0"
             style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {recruiter && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-0.5">
              {/* Avatar */}
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 select-none text-[10px] font-bold"
                style={{
                  backgroundColor: 'rgba(45,84,148,0.8)',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {initials(recruiter.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate"
                   style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {recruiter.name}
                </p>
                <p className="text-[10px] truncate"
                   style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {recruiter.email}
                </p>
              </div>
            </div>
          )}

          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-all duration-100"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            }}
          >
            <LogOut size={13} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
