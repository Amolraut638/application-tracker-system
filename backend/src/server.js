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

// ── Config ───────────────────────────────────────────────
const PORT        = process.env.PORT        ?? 5000
const CLIENT_URL  = process.env.CLIENT_URL  ?? 'http://localhost:5173'
const MONGODB_URI = process.env.MONGODB_URI ?? ''
const NODE_ENV    = process.env.NODE_ENV    ?? 'development'

const app = express()

// ── Security headers ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS — credentialed, explicit origin, no wildcard ────
app.use(cors({
  origin: CLIENT_URL.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true, // required for cookies
}))

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// ── Routes ───────────────────────────────────────────────
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/candidates', candidatesRouter)
app.use('/api/candidates/:id/resume', resumeRouter)
app.use('/api/candidates',            aiSummaryRouter)   // POST /:id/ai-summary
app.use('/api/dashboard', dashboardRouter)

// ── 404 handler ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global error handler ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Never log sensitive data
  console.error('[Error]', err.message ?? 'Internal server error')
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : (err.message ?? 'Internal server error'),
  })
})

// Disable Mongoose command buffering globally so ops fail fast when no connection
mongoose.set('bufferCommands', false)

// ── Database + server bootstrap ──────────────────────────
async function start() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // fail fast — before Axios 10s client timeout
        bufferCommands: false,          // don't buffer ops when disconnected
      })
      console.log('🍃  MongoDB connected')
    } catch (err) {
      console.error('❌  MongoDB connection failed:', err.message)
      process.exit(1)
    }
  } else {
    console.warn('⚠️   MONGODB_URI not set — database features disabled (auth will not work)')
  }

  const server = app.listen(PORT, () => {
    console.log(`✅  HireFlow API listening on http://localhost:${PORT}`)
    console.log(`   Health:     http://localhost:${PORT}/api/health`)
    console.log(`   Auth:       http://localhost:${PORT}/api/auth`)
    console.log(`   Candidates: http://localhost:${PORT}/api/candidates`)
    console.log(`   Resume:     http://localhost:${PORT}/api/candidates/:id/resume`)
    console.log(`   AI Summary: http://localhost:${PORT}/api/candidates/:id/ai-summary`)
    console.log(`   Dashboard:  http://localhost:${PORT}/api/dashboard`)
    console.log(`   CORS:       ${CLIENT_URL}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌  Port ${PORT} is already in use. Stop the other process and try again.`)
    } else {
      console.error('❌  Server error:', err.message)
    }
    process.exit(1)
  })
}

start()
