import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * PublicOnlyRoute — wraps Login and Register.
 * Authenticated users are redirected to the dashboard.
 */
export default function PublicOnlyRoute({ children }) {
  const { recruiter, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-indigo-600" />
      </div>
    )
  }

  if (recruiter) {
    return <Navigate to="/" replace />
  }

  return children
}
