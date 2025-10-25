import fetch from 'node-fetch'
import { get, set } from '../config/redis.js'

export const fetchRoutesFromORS = async (sourceLat, sourceLon, destLat, destLon, profile = 'driving-car') => {
  try {
    const cacheKey = `route:${sourceLat},${sourceLon}:${destLat},${destLon}:${profile}`
    const cached = await get(cacheKey)
    if (cached) {
      console.log('✅ Route cache HIT')
      return JSON.parse(cached)
    }
    console.log('❌ Route cache MISS - fetching from ORS')

    const url = 'https://api.openrouteservice.org/v2/directions/' + profile

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': process.env.OPENROUTE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [[sourceLon, sourceLat], [destLon, destLat]],
        preference: 'recommended',
        units: 'km',
        language: 'en',
        geometry: true,
        instructions: false,
        alternative_routes: {
          target_count: 2
        }
      })
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`OpenRouteService API error: ${response.status} ${text}`)
    }

    const data = await response.json()

    const routes = (data.routes || []).map(route => ({
      geometry: (route.geometry?.coordinates || []).map(coord => [coord[1], coord[0]]),
      distance: route.summary?.distance,
      duration: route.summary?.duration
    }))
    await set(cacheKey, JSON.stringify(routes), 3600)
    return routes

  } catch (error) {
    console.error('Routing service error:', error)
    throw error
  }
}
