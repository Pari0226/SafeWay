import express from 'express'
import { 
  getSafetyScore,
  getCrimeData,
  getAllCrimeData,
  submitReport,
  getNearbyReports
} from '../controllers/safetyController.js'
import { authMiddleware } from '../middleware/auth.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = express.Router()

// Public routes with caching
router.get('/score', cacheMiddleware(21600), getSafetyScore) // 6 hours
router.get('/crime-data', cacheMiddleware(86400), getAllCrimeData) // 24 hours
router.get('/crime-data/:city', cacheMiddleware(86400), getCrimeData) // 24 hours
router.get('/reports', cacheMiddleware(1800), getNearbyReports) // 30 minutes

// Protected routes (require auth, but allow anonymous reports)
router.post('/report', authMiddleware, submitReport)

export default router
