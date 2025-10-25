import { useState } from 'react'
import { routesAPI } from '../services/api'

export const useRoutes = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchRoutes = async (sourceLat, sourceLon, destLat, destLon, profile = 'driving-car') => {
    setLoading(true)
    setError(null)
    try {
      const response = await routesAPI.search({ sourceLat, sourceLon, destLat, destLon, profile })
      setRoutes(response.data.data)
      return response.data.data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch routes')
      return []
    } finally {
      setLoading(false)
    }
  }

  const saveRoute = async (routeData) => {
    try {
      const response = await routesAPI.save(routeData)
      return { success: true, data: response.data.data }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to save route' }
    }
  }

  const getFavorites = async () => {
    try {
      const response = await routesAPI.getFavorites()
      return response.data.data
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      return []
    }
  }

  const deleteRoute = async (id) => {
    try {
      await routesAPI.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete route' }
    }
  }

  return { routes, loading, error, searchRoutes, saveRoute, getFavorites, deleteRoute }
}
