import mongoose, { Schema, Document, Model } from 'mongoose'
import crypto from 'crypto'

// ✅ Define User interface
export interface IUser extends Document {
  username: string
  email: string
  password: string
  avatar?: string
  resetPasswordToken?: string
  resetPasswordExpire?: Date
  getResetPasswordToken(): string
  createdAt: Date
  updatedAt: Date
}

// ✅ User schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Hide password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
)

// ✅ Generate and hash password token
userSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set expire
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000)

  return resetToken
}

// ✅ Create and export model
export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)


