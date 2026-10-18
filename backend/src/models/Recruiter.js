import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const recruiterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // normalized on save
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries unless explicitly selected
    },
  },
  { timestamps: true },
)



// ── Hash password before save ─────────────────────────────
recruiterSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// ── Instance method: compare passwords ───────────────────
recruiterSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// ── Instance method: safe public fields ──────────────────
recruiterSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  }
}

const Recruiter = mongoose.model('Recruiter', recruiterSchema)
export default Recruiter
