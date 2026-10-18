import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoose from 'mongoose'

import healthRouter      from './routes/health.js'
import authRouter        from './routes/auth.js'
import candidatesRouter  from './routes/candidates.js'
import dashboardRouter   from './routes/dashboard.js'
import resumeRouter      from './routes/resume.js'
import aiSummaryRouter   from './routes/aiSummary.js'

const CLIENT_URL  = process.env.CLIENT_URL  ?? 'http://localhost:5173'
const NODE_ENV    = process.env.NODE_ENV    ?? 'development'

const app = express()

// ── Trust proxy (required for Render / reverse proxies to detect HTTPS & cookies) ──
app.set('trust proxy', 1)

// ── Security headers ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS — credentialed, explicit origin, no wildcard ────
app.use(cors({
  origin: CLIENT_URL.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // required for cookies
}))

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// ── Routes ───────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'HireFlow ATS API',
    status: 'online',
    health: '/api/health',
    version: '1.0.0',
  })
})

app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/candidates', candidatesRouter)
app.use('/api/candidates/:id/resume', resumeRouter)
app.use('/api/candidates', aiSummaryRouter) // POST /:id/ai-summary
app.use('/api/dashboard', dashboardRouter)

// ── 404 handler ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global error handler ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message ?? 'Internal server error')
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : (err.message ?? 'Internal server error'),
  })
})

// Disable Mongoose command buffering globally so ops fail fast when no connection
mongoose.set('bufferCommands', false)

export default app
