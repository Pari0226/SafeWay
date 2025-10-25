import express from 'express'
import authRoutes from './auth.js'
import routesRoutes from './routes.js'
import safetyRoutes from './safety.js'
import sosRoutes from './sos.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'SafeWay API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      routes: '/api/routes',
      safety: '/api/safety',
      sos: '/api/sos'
    }
  })
})

// Mount feature routes
router.use('/auth', authRoutes)
router.use('/routes', routesRoutes)
router.use('/safety', safetyRoutes)
router.use('/sos', sosRoutes)

export default router
