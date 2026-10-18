/**
 * cloudinary.js — centralized Cloudinary v2 SDK configuration.
 *
 * Credentials are read exclusively from server-side environment variables.
 * They are never exposed to the frontend or logged.
 */
import { v2 as cloudinary } from 'cloudinary'

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

/**
 * Returns true when all three Cloudinary credentials are present.
 * Used by route handlers to return a clear config error instead of
 * silently failing or pretending an upload succeeded.
 */
export function cloudinaryConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
}

// Configure the SDK only when credentials exist.
if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key:    CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure:     true,
  })
}

export default cloudinary
