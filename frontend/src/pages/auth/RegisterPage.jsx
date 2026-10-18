import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext.jsx'

const FEATURES = [
  { text: 'Six-stage hiring pipeline with full candidate tracking' },
  { text: 'Recruiting analytics and application trend charts' },
  { text: 'Searchable, filterable candidate database' },
  { text: 'Secure session-based recruiter authentication' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((err) => ({ ...err, [field]: '' }))
    setServerError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!form.confirm) e.confirm = 'Please confirm your password.'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setServerError('')
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account created! Welcome to HireFlow.')
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-between p-12 shrink-0"
        style={{ backgroundColor: '#0f1e36' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded"
               style={{ backgroundColor: '#2d5494' }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V5.5L7 2l5 3.5V12H9V8.5H5V12H2Z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight"
                style={{ color: 'rgba(255,255,255,0.95)' }}>
            HireFlow
          </span>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] mb-3"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Get Started Free
            </p>
            <h2 className="text-3xl font-bold leading-tight"
                style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
              Build your team<br />with confidence.
            </h2>
            <p className="mt-4 text-sm leading-relaxed"
               style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '280px' }}>
              Create your workspace in seconds. No credit card required.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-3">
                <CheckCircle2
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: '#14b8a6' }} // teal accent
                />
                <p className="text-sm leading-snug"
                   style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {f.text}
                </p>
              </div>
            ))}
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
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: '#1a2f54' }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5Zm0 7a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 12Z"/>
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="field-label">Full name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder="Alex Johnson"
                className={`input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="field-label">Email address</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="field-label">
                Password
                <span className="ml-1.5 font-normal text-slate-400 normal-case tracking-normal">
                  min. 8 characters
                </span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="field-label">Confirm password</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.confirm ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirm && <p className="mt-1.5 text-xs text-red-600">{errors.confirm}</p>}
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                id="register-submit"
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account…
                  </>
                ) : (
                  <>Create account <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
