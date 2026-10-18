import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * ProtectedRoute — wraps authenticated pages.
 * Shows a minimal loading screen while the session check is in progress.
 * Redirects unauthenticated users to /login, preserving the intended path.
 */
export default function ProtectedRoute({ children }) {
  const { recruiter, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-indigo-600" />
          <p className="text-xs text-neutral-400">Checking session…</p>
        </div>
      </div>
    )
  }

  if (!recruiter) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
