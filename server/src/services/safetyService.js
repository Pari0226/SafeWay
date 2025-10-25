import prisma from '../config/database.js'

// Calculate safety score for a location
export const calculateSafetyScore = async (latitude, longitude, currentTime = new Date()) => {
  try {
    const hour = currentTime.getHours()

    // Time-based multiplier
    let timeMultiplier = 1.0
    if (hour >= 6 && hour < 18) {
      timeMultiplier = 1.0
    } else if (hour >= 18 && hour < 22) {
      timeMultiplier = 0.85
    } else {
      timeMultiplier = 0.6
    }

    // Placeholder base score (replace with city/area crime stats from DB when available)
    const baseScore = 75

    const finalScore = Math.round(baseScore * timeMultiplier)

    let level = 'moderate'
    let color = '#F59E0B'

    if (finalScore >= 80) {
      level = 'safe'
      color = '#10B981'
    } else if (finalScore < 50) {
      level = 'risky'
      color = '#EF4444'
    }

    return {
      score: finalScore,
      level,
      color,
      factors: {
        baseScore: baseScore,
        timeMultiplier: timeMultiplier,
        currentHour: hour
      }
    }
  } catch (error) {
    console.error('Safety calculation error:', error)
    throw error
  }
}
