import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute  from './components/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute.jsx'
import AppLayout       from './components/layout/AppLayout.jsx'
import DashboardPage   from './pages/DashboardPage.jsx'
import CandidatesPage  from './pages/CandidatesPage.jsx'
import PipelinePage    from './pages/PipelinePage.jsx'
import LoginPage       from './pages/auth/LoginPage.jsx'
import RegisterPage    from './pages/auth/RegisterPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* ── Public auth routes ── */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* ── Protected app shell ── */}
          {/*
            ProtectedRoute renders AppLayout (which has <Outlet>) only when authenticated.
            AppLayout is passed as children and renders it, which includes <Outlet>.
            We use ProtectedRoute as the route element — it returns AppLayout (with Outlet)
            when authenticated, or redirects to /login.
            AppLayout itself uses <Outlet> so React Router fills nested routes into it.
          */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="pipeline"   element={<PipelinePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
