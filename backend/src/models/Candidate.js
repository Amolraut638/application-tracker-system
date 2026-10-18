import mongoose from 'mongoose'

export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [120, 'Position must be at most 120 characters'],
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    stage: {
      type: String,
      required: [true, 'Stage is required'],
      enum: { values: STAGES, message: 'Invalid stage: {VALUE}' },
      default: 'Applied',
    },
    source: {
      type: String,
      trim: true,
      default: '',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Resume metadata (optional) ────────────────────────
    // Binary is stored in Cloudinary; only metadata is persisted here.
    resume: {
      publicId:     { type: String },   // Cloudinary public_id for deletion
      fileName:     { type: String },   // Original filename shown to recruiter
      bytes:        { type: Number },   // File size in bytes
      format:       { type: String },   // e.g. "pdf"
      resourceType: { type: String },   // always "raw" for PDFs
      uploadedAt:   { type: Date },
    },
  },
  { timestamps: true },
)

// ── Indexes ────────────────────────────────────────────────
candidateSchema.index({ stage: 1 })
candidateSchema.index({ appliedAt: -1 })
candidateSchema.index({ name: 'text', email: 'text', position: 'text' })

// ── Normalize skills: trim whitespace, remove empty strings ──
candidateSchema.pre('save', function () {
  this.skills = this.skills
    .map((s) => s.trim())
    .filter(Boolean)
})

candidateSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate()
  if (Array.isArray(update?.skills)) {
    update.skills = update.skills.map((s) => s.trim()).filter(Boolean)
  }
})

const Candidate = mongoose.model('Candidate', candidateSchema)
export default Candidate
