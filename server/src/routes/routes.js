import express from 'express'
import { 
  searchRoutes, 
  saveRoute, 
  getFavoriteRoutes, 
  deleteRoute, 
  toggleFavorite 
} from '../controllers/routesController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ status: 'ok', service: 'routes', message: 'Routes service is working' })
})

// Public route
router.get('/search', searchRoutes)

// Protected routes
router.post('/save', authMiddleware, saveRoute)
router.get('/favorites', authMiddleware, getFavoriteRoutes)
router.delete('/:id', authMiddleware, deleteRoute)
router.patch('/:id/favorite', authMiddleware, toggleFavorite)

export default router
