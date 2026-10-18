import mongoose from 'mongoose'
import app from '../backend/src/app.js'

let isConnected = false

/**
 * Cached database connection helper for serverless execution.
 * Reuses active Mongoose connection across warm lambda invocations.
 */
async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true
    return
  }

  const uri = process.env.MONGODB_URI
  if (uri) {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    })
    isConnected = true
  }
}

export default async function handler(req, res) {
  try {
    await connectDB()
  } catch (err) {
    console.error('[Serverless DB Error]', err.message)
  }
  return app(req, res)
}
