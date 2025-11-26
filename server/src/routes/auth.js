import express from 'express'
import { register, login, getCurrentUser } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'ok', service: 'auth', message: 'Auth service is working' })
})

// Public
router.post('/register', register)
router.post('/login', login)

// Protected
router.get('/me', authMiddleware, getCurrentUser)

export default router
