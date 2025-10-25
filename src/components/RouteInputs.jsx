import { useEffect, useRef, useState } from 'react'
import { sleep } from '../utils/geocode.js'
import RouteSelector from './RouteSelector.jsx'

function RouteInputs({
  source,
  destination,
  setSource,
  setDestination,
  onSubmit,
  profile,
  setProfile,
  distanceKm,
  loading = false,
  error = '',
  onDropPinClick
}) {
  const panelRef = useRef(null)

  // Source suggestions state
  const [srcSuggestions, setSrcSuggestions] = useState([])
  const [srcLoading, setSrcLoading] = useState(false)
  const [srcError, setSrcError] = useState('')
  const [showSrc, setShowSrc] = useState(false)
  const [srcIndex, setSrcIndex] = useState(-1)

  // Destination suggestions state
  const [dstSuggestions, setDstSuggestions] = useState([])
  const [dstLoading, setDstLoading] = useState(false)
  const [dstError, setDstError] = useState('')
  const [showDst, setShowDst] = useState(false)
  const [dstIndex, setDstIndex] = useState(-1)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit && onSubmit()
  }

  // Debounced search helper
  useEffect(() => {
    let aborted = false
    let timer = null
    if (source && source.trim().length >= 3) {
      setSrcLoading(true)
      setSrcError('')
      setShowSrc(true)
      setSrcIndex(-1)
      timer = setTimeout(async () => {
        try {
          // small delay to respect rate limits if typing quickly
          await sleep(200)
          const q = source.trim()
          const url = new URL('https://nominatim.openstreetmap.org/search')
          url.searchParams.set('format', 'json')
          url.searchParams.set('q', q)
          url.searchParams.set('limit', '8')
          url.searchParams.set('addressdetails', '1')
          url.searchParams.set('dedupe', '1')
          url.searchParams.set('countrycodes', 'in')
          if (q.split(' ').length <= 2) {
            url.searchParams.set('extratags', '1')
          }
          const looksGwalior = /\bgwalior\b/i.test(q) || /amity|fort|phool bagh|thatipur|moti jheel|hazira|morar|city centre|jai vilas|scindia/i.test(q)
          if (looksGwalior) {
            const left = 78.05, right = 78.30, top = 26.30, bottom = 26.15
            url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
            url.searchParams.set('bounded', '1')
          }
          let res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          let data = await res.json()
          // Fallback 1: if no results and query has comma, search without comma
          if ((!Array.isArray(data) || data.length === 0) && q.includes(',')) {
            const withoutComma = q.replace(/,/g, '')
            const urlNoComma = new URL('https://nominatim.openstreetmap.org/search')
            urlNoComma.searchParams.set('format', 'json')
            urlNoComma.searchParams.set('q', withoutComma.trim())
            urlNoComma.searchParams.set('limit', '8')
            urlNoComma.searchParams.set('addressdetails', '1')
            urlNoComma.searchParams.set('dedupe', '1')
            urlNoComma.searchParams.set('countrycodes', 'in')
            const resNoComma = await fetch(urlNoComma.toString(), { headers: { 'Accept': 'application/json' } })
            if (resNoComma.ok) {
              const d2 = await resNoComma.json()
              if (Array.isArray(d2) && d2.length > 0) data = d2
            }
          }
          // Fallback 2: if still empty, try just the first part + Gwalior India
          if ((!Array.isArray(data) || data.length === 0) && q.includes(',')) {
            const firstPart = q.split(',')[0].trim()
            if (firstPart.length >= 3) {
              const urlFirst = new URL('https://nominatim.openstreetmap.org/search')
              urlFirst.searchParams.set('format', 'json')
              urlFirst.searchParams.set('q', `${firstPart} Gwalior India`)
              urlFirst.searchParams.set('limit', '8')
              urlFirst.searchParams.set('addressdetails', '1')
              urlFirst.searchParams.set('countrycodes', 'in')
              const resFirst = await fetch(urlFirst.toString(), { headers: { 'Accept': 'application/json' } })
              if (resFirst.ok) {
                const d3 = await resFirst.json()
                if (Array.isArray(d3) && d3.length > 0) data = d3
              }
            }
          }
          // Fallback 3: Generic broader fallback with India suffix
          if ((!Array.isArray(data) || data.length === 0)) {
            const alt = new URL('https://nominatim.openstreetmap.org/search')
            alt.searchParams.set('format', 'json')
            alt.searchParams.set('q', `${q} India`)
            alt.searchParams.set('limit', '8')
            alt.searchParams.set('addressdetails', '1')
            alt.searchParams.set('dedupe', '1')
            alt.searchParams.set('countrycodes', 'in')
            const altRes = await fetch(alt.toString(), { headers: { 'Accept': 'application/json' } })
            if (altRes.ok) data = await altRes.json()
          }
          // Fallback alias for Amity if nothing found
          if ((!Array.isArray(data) || data.length === 0) && /\bamity\b/i.test(q)) {
            const alias = 'Amity University Madhya Pradesh, Gwalior, Madhya Pradesh, India'
            const url2 = new URL('https://nominatim.openstreetmap.org/search')
            url2.searchParams.set('format', 'json')
            url2.searchParams.set('q', alias)
            url2.searchParams.set('limit', '8')
            url2.searchParams.set('countrycodes', 'in')
            const left = 78.05, right = 78.30, top = 26.30, bottom = 26.15
            url2.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
            url2.searchParams.set('bounded', '1')
            res = await fetch(url2.toString(), { headers: { 'Accept': 'application/json' } })
            if (res.ok) data = await res.json()
            // If still empty, try alias without bounding
            if ((!Array.isArray(data) || data.length === 0)) {
              const url2b = new URL('https://nominatim.openstreetmap.org/search')
              url2b.searchParams.set('format', 'json')
              url2b.searchParams.set('q', alias)
              url2b.searchParams.set('limit', '8')
              url2b.searchParams.set('countrycodes', 'in')
              const res2b = await fetch(url2b.toString(), { headers: { 'Accept': 'application/json' } })
              if (res2b.ok) data = await res2b.json()
            }
          }
          // If still empty and looksGwalior, try without bounding and explicit city/state
          if ((!Array.isArray(data) || data.length === 0) && looksGwalior) {
            const url3 = new URL('https://nominatim.openstreetmap.org/search')
            url3.searchParams.set('format', 'json')
            url3.searchParams.set('q', `${q}, Gwalior, Madhya Pradesh, India`)
            url3.searchParams.set('limit', '8')
            url3.searchParams.set('countrycodes', 'in')
            const res3 = await fetch(url3.toString(), { headers: { 'Accept': 'application/json' } })
            if (res3.ok) data = await res3.json()
          }
          if (!aborted) setSrcSuggestions(Array.isArray(data) ? data : [])
        } catch (err) {
          if (!aborted) {
            setSrcError('Search failed. Please try again.')
            setSrcSuggestions([])
          }
        } finally {
          if (!aborted) setSrcLoading(false)
        }
      }, 500)
    } else {
      setSrcSuggestions([])
      setShowSrc(false)
      setSrcLoading(false)
      setSrcError('')
    }
    return () => {
      aborted = true
      if (timer) clearTimeout(timer)
    }
  }, [source])

  useEffect(() => {
    let aborted = false
    let timer = null
    if (destination && destination.trim().length >= 3) {
      setDstLoading(true)
      setDstError('')
      setShowDst(true)
      setDstIndex(-1)
      timer = setTimeout(async () => {
        try {
          await sleep(200)
          const q = destination.trim()
          const url = new URL('https://nominatim.openstreetmap.org/search')
          url.searchParams.set('format', 'json')
          url.searchParams.set('q', q)
          url.searchParams.set('limit', '8')
          url.searchParams.set('addressdetails', '1')
          url.searchParams.set('dedupe', '1')
          url.searchParams.set('countrycodes', 'in')
          if (q.split(' ').length <= 2) {
            url.searchParams.set('extratags', '1')
          }
          const looksGwalior = /\bgwalior\b/i.test(q) || /amity|fort|phool bagh|thatipur|moti jheel|hazira|morar|city centre|jai vilas|scindia/i.test(q)
          if (looksGwalior) {
            const left = 78.05, right = 78.30, top = 26.30, bottom = 26.15
            url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
            url.searchParams.set('bounded', '1')
          }
          let res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          let data = await res.json()
          if ((!Array.isArray(data) || data.length === 0) && /\bamity\b/i.test(q)) {
            const alias = 'Amity University Madhya Pradesh, Gwalior, Madhya Pradesh, India'
            const url2 = new URL('https://nominatim.openstreetmap.org/search')
            url2.searchParams.set('format', 'json')
            url2.searchParams.set('q', alias)
            url2.searchParams.set('limit', '5')
            url2.searchParams.set('countrycodes', 'in')
            const left = 78.05, right = 78.30, top = 26.30, bottom = 26.15
            url2.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
            url2.searchParams.set('bounded', '1')
            res = await fetch(url2.toString(), { headers: { 'Accept': 'application/json' } })
            if (res.ok) data = await res.json()
          }
          if ((!Array.isArray(data) || data.length === 0) && looksGwalior) {
            const url3 = new URL('https://nominatim.openstreetmap.org/search')
            url3.searchParams.set('format', 'json')
            url3.searchParams.set('q', `${q}, Gwalior, Madhya Pradesh, India`)
            url3.searchParams.set('limit', '5')
            url3.searchParams.set('countrycodes', 'in')
            const res3 = await fetch(url3.toString(), { headers: { 'Accept': 'application/json' } })
            if (res3.ok) data = await res3.json()
          }
          if (!aborted) setDstSuggestions(Array.isArray(data) ? data : [])
        } catch (err) {
          if (!aborted) {
            setDstError('Search failed. Please try again.')
            setDstSuggestions([])
          }
        } finally {
          if (!aborted) setDstLoading(false)
        }
      }, 500)
    } else {
      setDstSuggestions([])
      setShowDst(false)
      setDstLoading(false)
      setDstError('')
    }
    return () => {
      aborted = true
      if (timer) clearTimeout(timer)
    }
  }, [destination])

  // Click outside to close dropdowns
  useEffect(() => {
    const onClick = (e) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target)) {
        setShowSrc(false)
        setShowDst(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onKeyDownSrc = (e) => {
    if (!showSrc) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSrcIndex((i) => Math.min(i + 1, srcSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSrcIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (srcIndex >= 0 && srcIndex < srcSuggestions.length) {
        e.preventDefault()
        const s = srcSuggestions[srcIndex]
        setSource(s.display_name)
        setShowSrc(false)
      }
    } else if (e.key === 'Escape') {
      setShowSrc(false)
    }
  }

  const onKeyDownDst = (e) => {
    if (!showDst) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDstIndex((i) => Math.min(i + 1, dstSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDstIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (dstIndex >= 0 && dstIndex < dstSuggestions.length) {
        e.preventDefault()
        const s = dstSuggestions[dstIndex]
        setDestination(s.display_name)
        setShowDst(false)
      }
    } else if (e.key === 'Escape') {
      setShowDst(false)
    }
  }

  const isDisabled = loading || !source?.trim() || !destination?.trim()

  return (
    <div className="route-panel" ref={panelRef}>
      <form className="route-form" onSubmit={handleSubmit}>
        <div className="selector-row">
          <RouteSelector profile={profile} setProfile={setProfile} distanceKm={distanceKm} />
        </div>
        <div className="form-row suggest-row">
          <label htmlFor="source" className="form-label">Source</label>
          <input
            id="source"
            type="text"
            className="form-input"
            placeholder="e.g., Gwalior Fort, Gwalior or Railway Station, Gwalior"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onFocus={() => source.trim().length >= 3 && setShowSrc(true)}
            onKeyDown={onKeyDownSrc}
            aria-autocomplete="list"
            aria-expanded={showSrc}
            aria-controls="src-suggestions"
          />
          {showSrc && (
            <div className="suggestions" id="src-suggestions" role="listbox">
              {srcLoading && <div className="suggestion muted">Loading…</div>}
              {!srcLoading && srcError && <div className="suggestion error">{srcError}</div>}
              {!srcLoading && !srcError && srcSuggestions.length === 0 && (
                <div className="suggestion muted">No results found</div>
              )}
              {!srcLoading && !srcError && srcSuggestions.map((s, idx) => (
                <div
                  key={s.place_id}
                  role="option"
                  className={`suggestion ${idx === srcIndex ? 'active' : ''}`}
                  onMouseEnter={() => setSrcIndex(idx)}
                  onMouseDown={(e) => {
                    // onMouseDown to select before input loses focus
                    e.preventDefault()
                    setSource(s.display_name)
                    setShowSrc(false)
                  }}
                >
                  <div className="suggestion-main">{s.name || (s.display_name || '').split(',')[0]}</div>
                  <div className="suggestion-detail">{(s.display_name || '').split(',').slice(1, 3).join(',').trim()}</div>
                </div>
              ))}
            </div>
          )}
          {showSrc && !srcLoading && !srcError && srcSuggestions.length === 0 && source.trim().length >= 3 && (
            <div className="search-help">💡 Try: "Gwalior Fort" or "Railway Station Gwalior" or just "Phool Bagh"</div>
          )}
          <div className="pin-drop-helper">
            {showSrc && !srcLoading && srcSuggestions.length === 0 && source.trim().length >= 3 && (
              <button
                type="button"
                className="drop-pin-btn"
                onClick={(e) => {
                  e.preventDefault()
                  onDropPinClick && onDropPinClick('source')
                  setShowSrc(false)
                }}
              >
                📍 Can't find it? Click map to drop pin
              </button>
            )}
          </div>
        </div>
        <div className="form-row suggest-row">
          <label htmlFor="destination" className="form-label">Destination</label>
          <input
            id="destination"
            type="text"
            className="form-input"
            placeholder="e.g., Phool Bagh, Gwalior or City Center, Gwalior"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => destination.trim().length >= 3 && setShowDst(true)}
            onKeyDown={onKeyDownDst}
            aria-autocomplete="list"
            aria-expanded={showDst}
            aria-controls="dst-suggestions"
          />
          {showDst && (
            <div className="suggestions" id="dst-suggestions" role="listbox">
              {dstLoading && <div className="suggestion muted">Loading…</div>}
              {!dstLoading && dstError && <div className="suggestion error">{dstError}</div>}
              {!dstLoading && !dstError && dstSuggestions.length === 0 && (
                <div className="suggestion muted">No results found</div>
              )}
              {!dstLoading && !dstError && dstSuggestions.map((s, idx) => (
                <div
                  key={s.place_id}
                  role="option"
                  className={`suggestion ${idx === dstIndex ? 'active' : ''}`}
                  onMouseEnter={() => setDstIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setDestination(s.display_name)
                    setShowDst(false)
                  }}
                >
                  <div className="suggestion-main">{s.name || (s.display_name || '').split(',')[0]}</div>
                  <div className="suggestion-detail">{(s.display_name || '').split(',').slice(1, 3).join(',').trim()}</div>
                </div>
              ))}
            </div>
          )}
          {showDst && !dstLoading && !dstError && dstSuggestions.length === 0 && destination.trim().length >= 3 && (
            <div className="search-help">💡 Try: "Gwalior Fort" or "Railway Station Gwalior" or just "Phool Bagh"</div>
          )}
          <div className="pin-drop-helper">
            {showDst && !dstLoading && dstSuggestions.length === 0 && destination.trim().length >= 3 && (
              <button
                type="button"
                className="drop-pin-btn"
                onClick={(e) => {
                  e.preventDefault()
                  onDropPinClick && onDropPinClick('destination')
                  setShowDst(false)
                }}
              >
                📍 Can't find it? Click map to drop pin
              </button>
            )}
          </div>
        </div>
        {typeof distanceKm === 'number' && (
          <div className="muted" style={{ marginTop: 2 }}>Distance: {distanceKm.toFixed(1)} km</div>
        )}
        {error ? <div className="status error">{error}</div> : null}
        {loading ? <div className="status loading">Finding route...</div> : null}
        <button type="submit" className="primary-btn" disabled={isDisabled}>
          {loading ? 'Finding…' : 'Find Safe Way'}
        </button>
      </form>
    </div>
  )
}

export default RouteInputs
