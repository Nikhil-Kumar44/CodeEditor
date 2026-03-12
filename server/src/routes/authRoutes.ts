import express, { Router } from 'express'
import { register, login, getMe, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router: Router = express.Router()

// ✅ Register
router.post('/register', register)

// ✅ Login
router.post('/login', login)

// ✅ Get current user
router.get('/me', protect, getMe)

// ✅ Update user profile
router.put('/profile', protect, updateProfile)

// ✅ Forgot Password
router.post('/forgotpassword', forgotPassword)

// ✅ Reset Password
router.put('/resetpassword/:resettoken', resetPassword)

export default router
