/**
 * upload.js — Multer middleware for resume uploads.
 *
 * Security measures:
 *  - Stores file in memory (no temp disk files); content goes directly to Cloudinary.
 *  - 5 MB hard limit enforced by Multer before reaching the route handler.
 *  - MIME type check (application/pdf) via Multer fileFilter.
 *  - PDF magic-byte check (first 4 bytes = %PDF) performed in the route handler
 *    after the buffer is available — this is the authoritative validation.
 *  - Original filename is preserved for display only; Cloudinary storage key
 *    is a server-generated UUID (public_id), never the user-supplied filename.
 */
import multer from 'multer'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

const storage = multer.memoryStorage()

/** Accept only files the browser declares as application/pdf */
function fileFilter(_req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are accepted.'))
  }
}

export const uploadResume = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
}).single('resume') // field name expected in the multipart form

/**
 * PDF magic-byte validator.
 * Call this after Multer has populated req.file.
 * Returns true when the buffer starts with the PDF signature (%PDF).
 */
export function isPdfBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false
  // %PDF = 0x25 0x50 0x44 0x46
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  )
}

/**
 * Express-compatible wrapper that converts Multer errors into
 * structured JSON responses consistent with the rest of the API.
 */
export function handleUploadErrors(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 5 MB.',
      })
    }
    return res.status(400).json({ success: false, message: err.message })
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
  next()
}
