export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function geocodePlace(query) {
  if (!query || !query.trim()) return null
  // Clean up minor noise like extra spaces and parentheses content
  const cleaned = query.replace(/\s+/g, ' ').replace(/\([^)]*\)/g, '').trim()

  async function attempt(q) {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '1')
    // Scope to India for better disambiguation
    url.searchParams.set('countrycodes', 'in')
    try {
      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
      if (!res.ok) {
        console.error('Geocoding HTTP error', res.status)
        return null
      }
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return null
      const first = data[0]
      return { name: first.display_name, lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
    } catch (err) {
      console.error('Geocoding failed', err)
      return null
    }
  }

  async function attemptWithinGwalior(q) {
    // Rough bounding box around Gwalior city
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'in')
    // viewbox: left,top,right,bottom (lon/lat). Use a tight box around Gwalior
    const left = 78.05, right = 78.30, top = 26.30, bottom = 26.15
    url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
    url.searchParams.set('bounded', '1')
    try {
      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return null
      const first = data[0]
      return { name: first.display_name, lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
    } catch {
      return null
    }
  }

  // Try 1: cleaned as-is
  let res = await attempt(cleaned)
  if (res) return res
  await sleep(250)

  // Try 2: append ", India" if missing
  if (!/\bindia\b/i.test(cleaned)) {
    res = await attempt(`${cleaned}, India`)
    if (res) return res
    await sleep(250)
  }

  // Try 3: if it seems like a Gwalior query or user context, bias by appending full city/state/country
  const looksGwalior = /\bgwalior\b/i.test(cleaned) || /fort|phool bagh|thatipur|moti jheel|lashkar|hazira|morar|city centre|db city mall|jai vilas|scindia/i.test(cleaned)
  if (looksGwalior && !/\bgwalior\b/i.test(cleaned)) {
    res = await attempt(`${cleaned}, Gwalior, Madhya Pradesh, India`)
    if (res) return res
    await sleep(250)
  }

  // Try 4: ensure explicit city even if already present, to strengthen signal
  if (/\bgwalior\b/i.test(cleaned)) {
    res = await attempt(`${cleaned}, Madhya Pradesh, India`)
    if (res) return res
  }

  // Try 5: If query mentions Amity and Gwalior, try the official alias and a viewbox-bounded search
  const mentionsAmity = /\bamity\b/i.test(cleaned)
  if (mentionsAmity) {
    const alias = 'Amity University Madhya Pradesh, Gwalior, Madhya Pradesh, India'
    res = await attempt(alias)
    if (res) return res
    await sleep(200)
    res = await attemptWithinGwalior(alias)
    if (res) return res
  }

  // Try 6: As a final bias, bound within Gwalior for the cleaned query
  if (looksGwalior) {
    res = await attemptWithinGwalior(cleaned)
    if (res) return res
  }

  return null
}
