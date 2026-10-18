import { Router } from 'express'
import Candidate, { STAGES } from '../models/Candidate.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// ── All routes require authentication ─────────────────────
router.use(protect)

// ── GET /api/dashboard/stats ──────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    // Current calendar month boundaries
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Run all queries in parallel
    const [
      totalCandidates,
      activeCandidates,
      hiredThisMonth,
      interviewCount,
      stageAgg,
      recentCandidates,
    ] = await Promise.all([
      // 1. Total candidates
      Candidate.countDocuments(),

      // 2. Active candidates (not Hired or Rejected)
      Candidate.countDocuments({ stage: { $nin: ['Hired', 'Rejected'] } }),

      // 3. Hired this month
      Candidate.countDocuments({
        stage: 'Hired',
        appliedAt: { $gte: monthStart, $lte: monthEnd },
      }),

      // 4. Currently in Interview
      Candidate.countDocuments({ stage: 'Interview' }),

      // 5. Stage distribution
      Candidate.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $sort:  { _id: 1 } },
      ]),

      // 6. Recent candidates (6 most recent by appliedAt)
      Candidate.find()
        .sort({ appliedAt: -1, createdAt: -1 })
        .limit(6)
        .lean(),
    ])

    // Normalize stage distribution so every stage has an entry
    const stageMap = Object.fromEntries(stageAgg.map((s) => [s._id, s.count]))
    const stageDistribution = STAGES.map((stage) => ({
      stage,
      count: stageMap[stage] ?? 0,
    }))

    return res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        activeCandidates,
        hiredThisMonth,
        interviewsScheduled: interviewCount,
        stageDistribution,
        recentCandidates,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
