import { haversineKm } from './geo.js'
const API_BASE = 'https://api.openrouteservice.org/v2/directions'

function hasKey() {
  return !!import.meta.env.VITE_OPENROUTE_API_KEY
}

async function backoffDelay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Decode Google/ORS encoded polyline to [[lat, lon], ...]
// precision defaults to 5 (ORS/Google). Some datasets may use 6.
function decodePolyline(str, precision = 5) {
  try {
    const coordinates = []
    let index = 0, lat = 0, lon = 0
    const factor = Math.pow(10, precision)
    while (index < str.length) {
      let b, shift = 0, result = 0
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1)
      lat += dlat

      shift = 0; result = 0
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
      const dlon = (result & 1) ? ~(result >> 1) : (result >> 1)
      lon += dlon

      coordinates.push([lat / factor, lon / factor])
    }
    return coordinates
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[ORS] decodePolyline failed', e)
    return []
  }
}

function toLatLng(coords) {
  // coords: [lon, lat] -> [lat, lon]
  return coords.map(([lon, lat]) => [lat, lon])
}

function parseORSResponse(json) {
  const routes = []
  if (!json) return routes

  // ORS may return { routes: [...] } or GeoJSON FeatureCollection { features: [...] }
  if (Array.isArray(json.routes)) {
    for (let i = 0; i < json.routes.length; i++) {
      const r = json.routes[i]
      const coords = r.geometry?.coordinates || []
      const distanceM = r.summary?.distance ?? r.segments?.[0]?.distance ?? 0
      const durationS = r.summary?.duration ?? r.segments?.[0]?.duration ?? 0
      routes.push({
        geometry: toLatLng(coords),
        distanceKm: distanceM / 1000,
        durationSec: durationS,
        index: i,
      })
    }
  } else if (Array.isArray(json.features)) {
    // FeatureCollection, take each feature as a route
    json.features.forEach((f, i) => {
      const coords = f.geometry?.coordinates || []
      const props = f.properties || {}
      const summary = props.summary || {}
      routes.push({
        geometry: toLatLng(coords),
        distanceKm: (summary.distance || 0) / 1000,
        durationSec: summary.duration || 0,
        index: i,
      })
    })
  }
  return routes
}

export async function fetchRoutes(sourceCoords, destCoords, profile = 'driving-car', retries = 3) {
  if (!hasKey()) {
    throw new Error('OpenRouteService API key is missing. Set VITE_OPENROUTE_API_KEY in .env')
  }
  const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY
  const maskedKey = typeof apiKey === 'string' ? apiKey.slice(0, 8) + '…' : 'n/a'

  const url = `${API_BASE}/${encodeURIComponent(profile)}`
  const dKm = haversineKm({ lat: sourceCoords.lat, lon: sourceCoords.lon }, { lat: destCoords.lat, lon: destCoords.lon })
  const body = {
    coordinates: [
      [sourceCoords.lon, sourceCoords.lat],
      [destCoords.lon, destCoords.lat],
    ],
    preference: 'recommended',
    units: 'km',
    language: 'en',
    geometry: true,
    instructions: false,
  }
  if (dKm <= 120) {
    body.alternative_routes = { target_count: 2, share_factor: 0.6, weight_factor: 1.4 }
  }

  let attempt = 0
  let lastErr
  while (attempt <= retries) {
    try {
      // Logging request (without exposing full key)
      // eslint-disable-next-line no-console
      console.log('[ORS] Request', { url, profile, coordinates: body.coordinates, hasKey: !!apiKey, keyPreview: maskedKey })
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Authorization': apiKey,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        // rate limited
        const text = await res.text().catch(() => '')
        throw new Error(`Rate limit reached (429). ${text}`)
      }
      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        // eslint-disable-next-line no-console
        console.error('API Error Status:', res.status)
        // eslint-disable-next-line no-console
        console.error('API Error Body:', errorText)
        throw new Error(`API Error ${res.status}: ${errorText}`)
      }

      const json = await res.json()
      // eslint-disable-next-line no-console
      console.log('🔍 ORS Raw Response:', json)
      const routesRaw = Array.isArray(json?.routes) ? json.routes : []
      if (routesRaw[0]) {
        // eslint-disable-next-line no-console
        console.log('🔍 First route:', routesRaw[0])
        // eslint-disable-next-line no-console
        console.log('🔍 Geometry structure:', routesRaw[0].geometry)
        // eslint-disable-next-line no-console
        console.log('🔍 Coordinates array:', routesRaw[0].geometry?.coordinates)
      }

      const routes = routesRaw.map((route, index) => {
        let coordinates = []
        const g = route.geometry
        if (g && Array.isArray(g.coordinates)) {
          coordinates = g.coordinates
          console.log(`✅ Route ${index}: ${coordinates.length} coordinates found`)
        } else if (Array.isArray(g)) {
          coordinates = g
          console.log(`✅ Route ${index}: ${coordinates.length} direct coordinates`)
        } else if (typeof g === 'string') {
          const decoded = decodePolyline(g, 5)
          // decoded is [lat, lon]; convert to [lat, lon] standard
          console.log(`✅ Route ${index}: decoded polyline with ${decoded.length} points`)
          return {
            geometry: decoded,
            distance: route.summary?.distance || 0,
            duration: route.summary?.duration || 0,
            distanceKm: (route.summary?.distance || 0) / 1000,
            durationSec: route.summary?.duration || 0,
            index,
          }
        } else {
          console.error(`❌ Route ${index}: No valid geometry found`, g)
        }

        const geometry = coordinates.map(coord => (Array.isArray(coord) && coord.length >= 2) ? [coord[1], coord[0]] : coord)
        console.log(`📍 Route ${index} final: ${geometry.length} points`)
        if (geometry.length > 0) {
          console.log(`   Start: [${geometry[0]}]`)
          console.log(`   End: [${geometry[geometry.length - 1]}]`)
        }
        return {
          geometry,
          distance: route.summary?.distance || 0,
          duration: route.summary?.duration || 0,
          distanceKm: (route.summary?.distance || 0) / 1000,
          durationSec: route.summary?.duration || 0,
          index,
        }
      })
      console.log('🗺️ Processed routes:', routes.map(r => ({ points: r.geometry.length, distance: r.distance, duration: r.duration })))
      if (!routes.length) {
        throw new Error('No routes found in response')
      }
      return routes
    } catch (err) {
      lastErr = err
      // eslint-disable-next-line no-console
      console.error('[ORS] Error', { attempt, message: String(err?.message || err), stack: err?.stack })
      attempt += 1
      // Do not retry on 4xx (except 429 which we threw above)
      const msg = String(lastErr?.message || '')
      if (/API Error\s+4\d{2}/.test(msg)) break
      if (attempt > retries) break
      // exponential backoff: 500ms, 1s, 2s, 4s...
      const delay = 500 * Math.pow(2, attempt - 1)
      // eslint-disable-next-line no-console
      console.warn(`[ORS] Retry in ${delay}ms (attempt ${attempt}/${retries})`)
      await backoffDelay(delay)
    }
  }
  throw lastErr || new Error('Unknown routing error')
}

// Debug helper: Delhi (77.2090, 28.6139) -> Mumbai (72.8777, 19.0760)
export async function debugTestDelhiMumbai(profile = 'driving-car') {
  // Use a within-limit example for free plan limits (~<=150km): Mumbai -> Pune
  const from = { lon: 72.8777, lat: 19.0760 } // Mumbai
  const to = { lon: 73.8567, lat: 18.5204 }   // Pune
  try {
    const routes = await fetchRoutes(from, to, profile, 1)
    // eslint-disable-next-line no-console
    console.log('[ORS][DEBUG] Routes (Mumbai->Pune)', routes)
    return routes
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[ORS][DEBUG] Failed Mumbai->Pune', e)
    throw e
  }
}

// Attach a window helper for quick manual testing from DevTools
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[ORS] Key preview:', hasKey() ? String(import.meta.env.VITE_OPENROUTE_API_KEY).slice(0, 8) + '…' : 'missing')
  // @ts-ignore
  window.SAFEWAY_ORS_DEBUG = debugTestDelhiMumbai
}