import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

/**
 * GET /api/health
 * Returns service status and basic environment info.
 * Does NOT expose secrets or connection strings.
 */
router.get('/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1
  res.status(200).json({
    success: true,
    service: 'hireflow-api',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

export default router
