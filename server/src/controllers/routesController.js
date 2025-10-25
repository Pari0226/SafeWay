import prisma from '../config/database.js'
import { fetchRoutesFromORS } from '../services/routingService.js'
import Joi from 'joi'

// Validation schemas
const saveRouteSchema = Joi.object({
  name: Joi.string().max(100).optional().allow(''),
  sourceName: Joi.string().required(),
  sourceLat: Joi.number().required(),
  sourceLon: Joi.number().required(),
  destName: Joi.string().required(),
  destLat: Joi.number().required(),
  destLon: Joi.number().required(),
  safetyScore: Joi.number().min(0).max(100).required(),
  distance: Joi.number().required(),
  profile: Joi.string().valid('driving-car', 'foot-walking', 'cycling-regular').required()
})

const searchRoutesSchema = Joi.object({
  sourceLat: Joi.number().required(),
  sourceLon: Joi.number().required(),
  destLat: Joi.number().required(),
  destLon: Joi.number().required(),
  profile: Joi.string().valid('driving-car', 'foot-walking', 'cycling-regular').default('driving-car')
})

// Search routes from OpenRouteService
export const searchRoutes = async (req, res) => {
  try {
    const { error, value } = searchRoutesSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { sourceLat, sourceLon, destLat, destLon, profile } = value

    console.log('Fetching routes from ORS:', { sourceLat, sourceLon, destLat, destLon, profile })

    const routes = await fetchRoutesFromORS(sourceLat, sourceLon, destLat, destLon, profile)

    res.status(200).json({
      success: true,
      data: routes,
      message: `Found ${routes.length} route(s)` 
    })

  } catch (error) {
    console.error('Search routes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes. Please try again.'
    })
  }
}

// Save a favorite route
export const saveRoute = async (req, res) => {
  try {
    const { error, value } = saveRouteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const savedRoute = await prisma.savedRoute.create({
      data: {
        userId: req.userId,
        ...value
      }
    })

    res.status(201).json({
      success: true,
      data: savedRoute,
      message: 'Route saved successfully'
    })

  } catch (error) {
    console.error('Save route error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save route'
    })
  }
}

// Get user's favorite routes
export const getFavoriteRoutes = async (req, res) => {
  try {
    const routes = await prisma.savedRoute.findMany({
      where: { userId: req.userId },
      orderBy: { lastUsed: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: routes,
      count: routes.length
    })

  } catch (error) {
    console.error('Get routes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes'
    })
  }
}

// Delete a saved route
export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params

    const route = await prisma.savedRoute.findUnique({
      where: { id }
    })

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      })
    }

    if (route.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this route'
      })
    }

    await prisma.savedRoute.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully'
    })

  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete route'
    })
  }
}

// Toggle favorite status
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params

    const route = await prisma.savedRoute.findUnique({
      where: { id }
    })

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      })
    }

    if (route.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      })
    }

    const updated = await prisma.savedRoute.update({
      where: { id },
      data: { 
        isFavorite: !route.isFavorite,
        lastUsed: new Date()
      }
    })

    res.status(200).json({
      success: true,
      data: updated,
      message: updated.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    })

  } catch (error) {
    console.error('Toggle favorite error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update route'
    })
  }
}
