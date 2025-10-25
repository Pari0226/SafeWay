import crimeData from '../data/crimeData.json'
import gwaliorAreas from '../data/gwaliorAreas.json'

function normalize(value, min, max) {
  if (value <= min) return 100
  if (value >= max) return 0
  return ((max - value) / (max - min)) * 100
}

function extractCity(locationName = '') {
  const name = (locationName || '').toLowerCase()
  // Try to match against known cities
  const cities = Object.keys(crimeData)
  for (const city of cities) {
    if (name.includes(city.toLowerCase())) return city
  }
  // Fallback: capitalize first word
  const first = name.split(',')[0].trim().split(' ')[0]
  if (!first) return null
  const cap = first.charAt(0).toUpperCase() + first.slice(1)
  return cities.find(c => c.toLowerCase().startsWith(first)) || cap
}

function getAreaScore(locationName = '') {
  const s = (locationName || '').toLowerCase()
  if (/(isolated|remote|deserted|lonely)/.test(s)) return 40 // base 50 - 10
  if (/(market|mall|station|junction|bus stand|metro|downtown|central)/.test(s)) return 60 // base 50 + 10
  if (/(highway|expressway|road|bypass)/.test(s)) return 55 // base 50 + 5
  return 50
}

function getAreaScoreCityAware(locationName = '', city = '') {
  const c = (city || '').toLowerCase()
  const s = (locationName || '').toLowerCase()
  if (c === 'gwalior') {
    let best = null
    for (const [name, score] of Object.entries(gwaliorAreas)) {
      if (s.includes(name.toLowerCase())) {
        if (best === null || score > best) best = score
      }
    }
    if (best !== null) return best
  }
  return getAreaScore(locationName)
}

function getTimeScore(currentTime = new Date()) {
  const h = currentTime.getHours()
  // Map multipliers to a 0-100 score for combination
  if (h >= 6 && h < 18) return 100 // 1.0x safest
  if (h >= 18 && h < 22) return 85  // 0.85x
  return 60 // 0.6x
}

function getDensityScore(size = 'tier2') {
  // Higher score = safer for walking/public presence
  switch (size) {
    case 'metro':
      return 60
    case 'small':
      return 80
    default:
      return 70 // tier2
  }
}

export function calculateRouteSafety(sourceLocation, destLocation, currentTime = new Date()) {
  const srcCity = extractCity(sourceLocation)
  const dstCity = extractCity(destLocation)
  const srcData = crimeData[srcCity] || null
  const dstData = crimeData[dstCity] || null

  // Base crime score: inverse of crime rate (15-45 realistic band), combined with women/night indices subtly
  const crimeMin = 15, crimeMax = 45
  const srcCrime = srcData ? normalize(srcData.crimeRate, crimeMin, crimeMax) : 55
  const dstCrime = dstData ? normalize(dstData.crimeRate, crimeMin, crimeMax) : 55
  const baseCrime = (srcCrime + dstCrime) / 2
  const womenIdxAdj = ((srcData?.womenSafety ?? 7) + (dstData?.womenSafety ?? 7)) / 2 / 10 * 10 // 0..10 boost
  const nightIdxAdj = ((srcData?.nightSafety ?? 6) + (dstData?.nightSafety ?? 6)) / 2 / 10 * 10 // 0..10 boost
  const crimeScore = Math.max(0, Math.min(100, baseCrime * 0.85 + womenIdxAdj * 0.1 + nightIdxAdj * 0.05))

  // Time factor score
  const timeScore = getTimeScore(currentTime)

  const srcArea = getAreaScoreCityAware(sourceLocation, srcCity)
  const dstArea = getAreaScoreCityAware(destLocation, dstCity)
  const areaScore = (srcArea + dstArea) / 2

  // Density score from city size
  const srcDensity = getDensityScore(srcData?.size)
  const dstDensity = getDensityScore(dstData?.size)
  const densityScore = (srcDensity + dstDensity) / 2

  // Weighted final score
  const finalScore = Math.round(
    (crimeScore * 0.4) +
    (timeScore * 0.25) +
    (areaScore * 0.2) +
    (densityScore * 0.15)
  )

  let level = 'moderate'
  let color = '#F59E0B' // yellow
  if (finalScore >= 80) { level = 'safe'; color = '#10B981' }
  else if (finalScore < 50) { level = 'risky'; color = '#EF4444' }

  return {
    score: finalScore,
    level,
    color,
    factors: {
      crime: Math.round(crimeScore),
      time: Math.round(timeScore),
      area: Math.round(areaScore),
      density: Math.round(densityScore),
      sourceCity: srcCity,
      destCity: dstCity,
    }
  }
}

export function formatCurrentTime(d = new Date()) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
