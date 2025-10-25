import prisma from '../config/database.js'
import { calculateSafetyScore } from '../services/safetyService.js'
import Joi from 'joi'

const safetyScoreSchema = Joi.object({
  lat: Joi.number().required(),
  lon: Joi.number().required(),
  time: Joi.date().optional()
})

const reportSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  incidentType: Joi.string().required(),
  severity: Joi.number().min(1).max(5).required(),
  description: Joi.string().max(500).optional().allow(''),
  isAnonymous: Joi.boolean().optional()
})

const reportsQuerySchema = Joi.object({
  lat: Joi.number().required(),
  lon: Joi.number().required(),
  radius: Joi.number().min(0.1).max(50).default(5)
})

export const getSafetyScore = async (req, res) => {
  try {
    const { error, value } = safetyScoreSchema.validate(req.query)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { lat, lon, time } = value
    const currentTime = time ? new Date(time) : new Date()

    const safetyData = await calculateSafetyScore(lat, lon, currentTime)

    res.status(200).json({ success: true, data: safetyData })
  } catch (error) {
    console.error('Get safety score error:', error)
    res.status(500).json({ success: false, error: 'Failed to calculate safety score' })
  }
}

export const getCrimeData = async (req, res) => {
  try {
    const { city } = req.params
    if (!city) {
      return res.status(400).json({ success: false, error: 'City name is required' })
    }

    const crimeData = await prisma.crimeData.findUnique({ where: { city } })
    if (!crimeData) {
      return res.status(404).json({ success: false, error: 'Crime data not found for this city' })
    }

    res.status(200).json({ success: true, data: crimeData })
  } catch (error) {
    console.error('Get crime data error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch crime data' })
  }
}

export const getAllCrimeData = async (req, res) => {
  try {
    const crimeData = await prisma.crimeData.findMany({ orderBy: { crimeRate: 'asc' } })
    res.status(200).json({ success: true, data: crimeData, count: crimeData.length })
  } catch (error) {
    console.error('Get all crime data error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch crime data' })
  }
}

export const submitReport = async (req, res) => {
  try {
    const { error, value } = reportSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { latitude, longitude, incidentType, severity, description, isAnonymous } = value

    const report = await prisma.safetyReport.create({
      data: {
        userId: isAnonymous ? null : req.userId,
        latitude,
        longitude,
        incidentType,
        severity,
        description: description || null,
        isAnonymous: isAnonymous || false
      }
    })

    res.status(201).json({ success: true, data: report, message: 'Safety report submitted successfully' })
  } catch (error) {
    console.error('Submit report error:', error)
    res.status(500).json({ success: false, error: 'Failed to submit report' })
  }
}

export const getNearbyReports = async (req, res) => {
  try {
    const { error, value } = reportsQuerySchema.validate(req.query)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { lat, lon, radius } = value

    const latDelta = radius / 111
    const lonDelta = radius / (111 * Math.cos(lat * Math.PI / 180))

    const reports = await prisma.safetyReport.findMany({
      where: {
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lon - lonDelta, lte: lon + lonDelta },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        incidentType: true,
        severity: true,
        description: true,
        isAnonymous: true,
        createdAt: true
      }
    })

    res.status(200).json({ success: true, data: reports, count: reports.length })
  } catch (error) {
    console.error('Get nearby reports error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch reports' })
  }
}
