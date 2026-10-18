import { Router } from 'express'
import mongoose from 'mongoose'
import Candidate, { STAGES } from '../models/Candidate.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// ── All routes require authentication ─────────────────────
router.use(protect)

// ── Helpers ───────────────────────────────────────────────

/** Validate a MongoDB ObjectId — return false if invalid */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

/** Extract a safe validation error message from Mongoose errors */
function validationMessage(err) {
  return Object.values(err.errors)
    .map((e) => e.message)
    .join(' ')
}

/**
 * Build a safe regex from a search string.
 * Escapes all regex special chars to prevent ReDoS.
 */
function safeRegex(str) {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, 'i')
}

// ── GET /api/candidates ───────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      search   = '',
      stage    = '',
      position = '',
      page     = '1',
      limit    = '20',
    } = req.query

    // Build query
    const filter = {}

    if (search.trim()) {
      const rx = safeRegex(search.trim())
      filter.$or = [
        { name:     rx },
        { email:    rx },
        { position: rx },
      ]
    }

    if (stage.trim()) {
      if (!STAGES.includes(stage.trim())) {
        return res.status(400).json({ success: false, message: `Invalid stage filter: ${stage}` })
      }
      filter.stage = stage.trim()
    }

    if (position.trim()) {
      filter.position = safeRegex(position.trim())
    }

    // Pagination
    const pageNum  = Math.max(1, parseInt(page,  10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const skip     = (pageNum - 1) * limitNum

    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ appliedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Candidate.countDocuments(filter),
    ])

    return res.status(200).json({
      success: true,
      data: candidates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/candidates/:id ───────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    const candidate = await Candidate.findById(id).lean()
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    return res.status(200).json({ success: true, data: candidate })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/candidates ──────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone      = '',
      position,
      experience = 0,
      skills     = [],
      stage      = 'Applied',
      source     = '',
      appliedAt,
      notes      = '',
    } = req.body

    // Required field checks (additional layer beyond Mongoose validation)
    if (!name?.trim())     return res.status(400).json({ success: false, message: 'Name is required.' })
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'Email is required.' })
    if (!position?.trim()) return res.status(400).json({ success: false, message: 'Position is required.' })
    if (experience < 0)    return res.status(400).json({ success: false, message: 'Experience cannot be negative.' })
    if (!STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage: ${stage}` })
    }

    const candidate = await Candidate.create({
      name: name.trim(),
      email,
      phone,
      position: position.trim(),
      experience: Number(experience),
      skills: Array.isArray(skills) ? skills : [],
      stage,
      source,
      appliedAt: appliedAt ? new Date(appliedAt) : undefined,
      notes,
    })

    return res.status(201).json({ success: true, data: candidate })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: validationMessage(err) })
    }
    next(err)
  }
})

// ── PATCH /api/candidates/:id ─────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    // Whitelist — only allow known fields
    const allowed = [
      'name', 'email', 'phone', 'position', 'experience',
      'skills', 'stage', 'source', 'appliedAt', 'notes',
    ]
    const update = {}
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key]
    }

    // Validate stage if provided
    if (update.stage !== undefined && !STAGES.includes(update.stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage: ${update.stage}` })
    }

    // Validate experience if provided
    if (update.experience !== undefined && Number(update.experience) < 0) {
      return res.status(400).json({ success: false, message: 'Experience cannot be negative.' })
    }

    // Trim strings
    if (update.name)     update.name     = update.name.trim()
    if (update.position) update.position = update.position.trim()
    if (update.experience !== undefined) update.experience = Number(update.experience)

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean()

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    return res.status(200).json({ success: true, data: candidate })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: validationMessage(err) })
    }
    next(err)
  }
})

// ── DELETE /api/candidates/:id ────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' })
    }

    const candidate = await Candidate.findByIdAndDelete(id)
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    return res.status(200).json({ success: true, message: 'Candidate deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

export default router
