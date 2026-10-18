import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext.jsx'

// CSS-based pipeline stage visual — restrained and informative
function PipelineStages() {
  const stages = [
    { label: 'Applied',   active: true  },
    { label: 'Screening', active: true  },
    { label: 'Interview', active: true  },
    { label: 'Offer',     active: false },
    { label: 'Hired',     active: false },
  ]
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          {/* Stage number */}
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{
              backgroundColor: s.active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: s.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
              border: s.active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {i + 1}
          </div>
          {/* Connector + label */}
          <div className="flex-1">
            <p
              className="text-xs font-medium"
              style={{ color: s.active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)' }}
            >
              {s.label}
            </p>
          </div>
          {/* Progress indicator */}
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: s.active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)' }}
          />
        </div>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((err) => ({ ...err, [field]: '' }))
    setAuthError('')
  }

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setAuthError('')
    try {
      await login(form.email.trim(), form.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      setAuthError(err.message ?? 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand ───────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-between p-12 shrink-0"
        style={{ backgroundColor: '#0f1e36' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ backgroundColor: '#2d5494' }}
          >
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V5.5L7 2l5 3.5V12H9V8.5H5V12H2Z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
            HireFlow
          </span>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] mb-3"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Recruiting Platform
            </p>
            <h2 className="text-3xl font-bold leading-tight"
                style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
              Every great hire<br />starts here.
            </h2>
            <p className="mt-4 text-sm leading-relaxed"
               style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '280px' }}>
              Track candidates from application to offer in one focused, professional workspace.
            </p>
          </div>

          {/* Pipeline stage visual */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
               style={{ color: 'rgba(255,255,255,0.25)' }}>
              Hiring Pipeline
            </p>
            <PipelineStages />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} HireFlow
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Recruiting made simple
          </p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10 self-start w-full max-w-sm mx-auto">
          <div className="flex h-7 w-7 items-center justify-center rounded"
               style={{ backgroundColor: '#0f1e36' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V5.5L7 2l5 3.5V12H9V8.5H5V12H2Z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">HireFlow</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="mb-5 flex items-start gap-2.5 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5Zm0 7a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 12Z"/>
              </svg>
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="field-label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="field-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: '#1a2f54' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
