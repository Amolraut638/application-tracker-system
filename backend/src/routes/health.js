import { Router } from 'express'

const router = Router()

/**
 * GET /api/health
 * Returns service status and basic environment info.
 * Does NOT expose secrets or connection strings.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'hireflow-api',
    version: '1.0.0',
    phase: 'Phase 1 — No database',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

export default router
