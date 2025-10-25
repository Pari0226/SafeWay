import { useState } from 'react'
import { safetyAPI } from '../services/api'

export const useSafety = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getSafetyScore = async (lat, lon) => {
    setLoading(true)
    setError(null)
    try {
      const response = await safetyAPI.getSafetyScore({ lat, lon })
      return response.data.data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get safety score')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getCrimeData = async (city) => {
    try {
      const response = await safetyAPI.getCrimeData(city)
      return response.data.data
    } catch (err) {
      console.error('Failed to get crime data:', err)
      return null
    }
  }

  const submitReport = async (reportData) => {
    try {
      const response = await safetyAPI.submitReport(reportData)
      return { success: true, data: response.data.data }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to submit report' }
    }
  }

  const getNearbyReports = async (lat, lon, radius = 5) => {
    try {
      const response = await safetyAPI.getNearbyReports({ lat, lon, radius })
      return response.data.data
    } catch (err) {
      console.error('Failed to get nearby reports:', err)
      return []
    }
  }

  return { loading, error, getSafetyScore, getCrimeData, submitReport, getNearbyReports }
}
