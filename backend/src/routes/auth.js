import { Router } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import Recruiter from '../models/Recruiter.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// ── Helpers ───────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production'

/**
 * Issue a signed JWT and set it as an HTTP-only cookie.
 * The cookie is:
 *   - httpOnly: JS cannot read it (prevents XSS token theft)
 *   - sameSite: 'lax' in dev (works with localhost same-site), 'none' in prod cross-site
 *   - secure: false in dev, true in prod
 *
 * SameSite=Lax is used in development because both frontend and backend
 * run on localhost (same registrable domain). If deployed cross-site,
 * set NODE_ENV=production to switch to SameSite=None; Secure.
 */
function issueToken(res, recruiterId) {
  const token = jwt.sign(
    { sub: recruiterId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  )

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  })

  return token
}

// ── DB error guard ────────────────────────────────────────
// When MONGODB_URI is not set, Mongoose throws a buffering timeout.
// Return a clean 503 instead of leaking internal error messages.
function isDbError(err) {
  return (
    err.name === 'MongooseError' ||
    (typeof err.message === 'string' && err.message.includes('buffering timed out'))
  )
}

// ── Rate limiter for auth endpoints ──────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }

    // Create recruiter — duplicate email triggers Mongoose unique error
    const recruiter = await Recruiter.create({ name: name.trim(), email, password })

    // Issue session immediately after registration
    const token = issueToken(res, recruiter._id)

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      recruiter: recruiter.toSafeObject(),
    })
  } catch (err) {
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Please try again later.' })
    }
    // Handle duplicate email (Mongo error code 11000)
    if (err.code === 11000 || err.name === 'MongoServerError') {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' })
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join(' ')
      return res.status(400).json({ success: false, message })
    }
    next(err)
  }
})

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }

    // Explicitly select password (field has select:false on schema)
    const recruiter = await Recruiter.findOne({ email: email.toLowerCase().trim() }).select('+password')

    // Generic message — do not reveal whether email exists
    const invalidMsg = 'Invalid email or password.'
    if (!recruiter) {
      return res.status(401).json({ success: false, message: invalidMsg })
    }

    const passwordMatch = await recruiter.comparePassword(password)
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: invalidMsg })
    }

    const token = issueToken(res, recruiter._id)

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      recruiter: recruiter.toSafeObject(),
    })
  } catch (err) {
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Please try again later.' })
    }
    next(err)
  }
})

// ── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    token: req.token,
    recruiter: req.recruiter,
  })
})

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  })
  return res.status(200).json({ success: true, message: 'Logged out successfully.' })
})

export default router
