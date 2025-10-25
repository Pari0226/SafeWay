import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import MapView from './components/MapView.jsx'
import RouteInputs from './components/RouteInputs.jsx'
import { geocodePlace, sleep } from './utils/geocode.js'
import SOSModal from './components/SOSModal.jsx'
import { calculateRouteSafety } from './utils/safetyScoring.js'
import SafetyInfo from './components/SafetyInfo.jsx'
import { fetchRoutes } from './utils/routingAPI.js'
import RouteOptions from './components/RouteOptions.jsx'
import { haversineKm } from './utils/geo.js'
import Dashboard from './pages/Dashboard.jsx'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Inline-styled LogoutMenu per spec
function LogoutMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch (_) {}
      window.location.href = '/login'
    }
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff', border: 'none', fontSize: '16px', fontWeight: 'bold',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.3s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)' }}
        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)' }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={user?.email || 'Account'}
      >
        {userInitial}
      </button>

      {isOpen && (
        <div
          style={{ position: 'absolute', top: '50px', right: 0, width: '220px', backgroundColor: '#fff',
            borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e0e0e0', zIndex: 1000,
            animation: 'fadeIn 0.2s ease-in-out' }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#333', fontSize: 14 }}>{user?.name || 'User'}</p>
            <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{user?.email || 'user@example.com'}</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            <button
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#333', fontSize: 14, transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              👤 Profile
            </button>
            <button
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#333', fontSize: 14, transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              ⚙️ Settings
            </button>
            <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '8px 0' }} />
            <button
              onClick={handleLogout}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#DC2626', fontSize: 14, fontWeight: 600, transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#fee2e2')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              🚪 Logout
            </button>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }`}</style>
        </div>
      )}
    </div>
  )
}

function App() {
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sourceCoord, setSourceCoord] = useState(null) // { lat, lon, name }
  const [destCoord, setDestCoord] = useState(null)     // { lat, lon, name }
  const [safetyInfo, setSafetyInfo] = useState(null)
  const [profile, setProfile] = useState('driving-car')
  const [routes, setRoutes] = useState([]) // [{ geometry: [[lat,lon],...], distanceKm, durationSec, safety, index }]
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [distanceKm, setDistanceKm] = useState(null)
  const [pinMode, setPinMode] = useState(null) // null | 'source' | 'destination'
  const [tempPin, setTempPin] = useState(null)

  const handleFindRoute = async () => {
    // Basic validation
    if (!source.trim() || !destination.trim()) {
      setError('Please enter both Source and Destination.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const src = await geocodePlace(source)
      await sleep(600) // small delay to respect rate limits
      const dst = await geocodePlace(destination)

      if (!src || !dst) {
        setError('Could not find one or both locations. Please refine your inputs.')
        setSourceCoord(null)
        setDestCoord(null)
        return
      }

      const srcC = { lat: src.lat, lon: src.lon, name: src.name }
      const dstC = { lat: dst.lat, lon: dst.lon, name: dst.name }
      setSourceCoord(srcC)
      setDestCoord(dstC)

      // Compute distance for UI/help only (do not auto-switch profile)
      const dKm = haversineKm(srcC, dstC)
      setDistanceKm(dKm)

      // Fetch routes from OpenRouteService
      let fetchedRoutes = []
      try {
        fetchedRoutes = await fetchRoutes(srcC, dstC, profile)
      } catch (routeErr) {
        // Graceful fallback: no ORS routes
        let msg = routeErr?.message || ''
        // Helpful guidance based on profile/distance
        if (profile === 'foot-walking' && dKm > 15) {
          msg += ' OpenRouteService does not support walking for distances > 15 km. Try Driving or Cycling.'
        } else if (profile === 'cycling-regular' && dKm > 60) {
          msg += ' Cycling may not be supported for distances > 60 km. Try Driving.'
        }
        setError(`Could not fetch routes from OpenRouteService. ${msg} Showing straight-line estimate. Route distance: ${dKm.toFixed(1)} km.`)
        fetchedRoutes = []
      }

      // Compute safety for each route (using names/time). If no routes, compute for straight line.
      if (fetchedRoutes.length > 0) {
        const routesWithSafety = fetchedRoutes.map((r, idx) => {
          const s = calculateRouteSafety(source, destination, new Date())
          return {
            ...r,
            // keep raw distance/duration fields that util provided
            safety: s,                 // full object for internal use
            safetyScore: s.score,      // number for sorting/UI
            safetyLevel: s.level,      // 'safe' | 'moderate' | 'risky'
            color: s.color,            // used by MapView polylines
            index: idx,
          }
        })

        // Filter out any routes with empty geometry
        let validRoutes = routesWithSafety.filter(r => Array.isArray(r.geometry) && r.geometry.length > 0)

        // If nothing valid, create a straight-line fallback so something is always shown
        if (validRoutes.length === 0 && srcC && dstC) {
          console.warn('⚠️ No valid route geometry, creating straight line fallback')
          const safety = calculateRouteSafety(source, destination, new Date())
          validRoutes = [{
            geometry: [ [srcC.lat, srcC.lon], [dstC.lat, dstC.lon] ],
            distanceKm: dKm,
            durationSec: 0,
            index: 0,
            isFallback: true,
            safety,
            safetyScore: safety.score,
            safetyLevel: safety.level,
            color: safety.color,
          }]
        }

        // Sort by safety score (safest first)
        validRoutes.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))

        setRoutes(validRoutes)
        setSelectedRouteIndex(0)
        setSafetyInfo(validRoutes[0]?.safety || calculateRouteSafety(source, destination, new Date()))
        // Non-blocking hint: long trip => alternatives may be absent (handled in API util)
      } else {
        const safety = calculateRouteSafety(source, destination, new Date())
        setSafetyInfo(safety)
        setRoutes([])
        setSelectedRouteIndex(0)
      }
    } catch (e) {
      setError('An unexpected error occurred while finding the route.')
      setSafetyInfo(null)
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }

  const handlePinDrop = async (coords) => {
    if (!pinMode) return
    if (pinMode === 'source') {
      setTempPin(coords)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
        const data = await response.json()
        const name = data.display_name || `Location (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
        setSource(name)
        setSourceCoord({ lat: coords.lat, lon: coords.lon, name })
      } catch (err) {
        const fallbackName = `Dropped Pin (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
        setSource(fallbackName)
        setSourceCoord({ lat: coords.lat, lon: coords.lon, name: fallbackName })
      } finally {
        setPinMode(null)
        setTempPin(null)
      }
    } else if (pinMode === 'destination') {
      setTempPin(coords)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
        const data = await response.json()
        const name = data.display_name || `Location (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
        setDestination(name)
        setDestCoord({ lat: coords.lat, lon: coords.lon, name })
      } catch (err) {
        const fallbackName = `Dropped Pin (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
        setDestination(fallbackName)
        setDestCoord({ lat: coords.lat, lon: coords.lon, name: fallbackName })
      } finally {
        setPinMode(null)
        setTempPin(null)
      }
    }
  }

  const mainContent = (
    <div className="app">
      <div style={{ position: 'fixed', top: 15, right: 15, zIndex: 9999 }}>
        <LogoutMenu />
      </div>
      <RouteInputs
        source={source}
        destination={destination}
        setSource={setSource}
        setDestination={setDestination}
        profile={profile}
        setProfile={setProfile}
        distanceKm={distanceKm}
        onSubmit={handleFindRoute}
        loading={loading}
        error={error}
        onDropPinClick={setPinMode}
      />
      <MapView
        sourceCoord={sourceCoord}
        destCoord={destCoord}
        safetyInfo={safetyInfo}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        onRouteSelect={setSelectedRouteIndex}
        pinMode={pinMode}
        handlePinDrop={handlePinDrop}
        tempPin={tempPin}
        setPinMode={setPinMode}
      />
      {safetyInfo && (
        <SafetyInfo safety={safetyInfo} />
      )}
      {routes.length > 0 && (
        <RouteOptions
          routes={routes}
          selectedIndex={selectedRouteIndex}
          onSelect={(i) => {
            setSelectedRouteIndex(i)
            const r = routes[i]
            if (r?.safety) setSafetyInfo(r.safety)
          }}
        />
      )}
      <SOSModal />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
