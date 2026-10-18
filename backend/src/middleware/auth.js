import jwt from 'jsonwebtoken'
import Recruiter from '../models/Recruiter.js'

/**
 * protect — reads the JWT from the http-only cookie,
 * verifies it, and attaches the safe recruiter object to req.recruiter.
 *
 * Usage: router.get('/me', protect, meHandler)
 */
export async function protect(req, res, next) {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Session expired or invalid' })
    }

    // Load recruiter from DB to ensure account still exists
    const recruiter = await Recruiter.findById(decoded.sub).select('-password')
    if (!recruiter) {
      return res.status(401).json({ success: false, message: 'Account no longer exists' })
    }

    req.recruiter = recruiter.toSafeObject()
    next()
  } catch (err) {
    next(err)
  }
}
