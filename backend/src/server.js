import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

// ── Config ───────────────────────────────────────────────
const PORT        = process.env.PORT        ?? 5000
const CLIENT_URL  = process.env.CLIENT_URL  ?? 'http://localhost:5173'
const MONGODB_URI = process.env.MONGODB_URI ?? ''

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
