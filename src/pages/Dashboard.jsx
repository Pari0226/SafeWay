import React, { useState, useEffect, useCallback, useRef } from 'react'
import SOSModal from '../components/SOSModal.jsx'
import RouteInputs from '../components/RouteInputs.jsx'
import MapView from '../components/MapView.jsx'
import SafetyInfo from '../components/SafetyInfo.jsx'
import RouteOptions from '../components/RouteOptions.jsx'
import { geocodePlace, sleep } from '../utils/geocode.js'
import { fetchRoutes } from '../utils/routingAPI.js'
import { calculateRouteSafety } from '../utils/safetyScoring.js'
import { haversineKm } from '../utils/geo.js'

export default function Dashboard() {
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [mode, setMode] = useState('Driving')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const menuRef = useRef(null)

  const [sourceCoord, setSourceCoord] = useState(null)
  const [destCoord, setDestCoord] = useState(null)
  const [safetyInfo, setSafetyInfo] = useState(null)
  const [profile, setProfile] = useState('driving-car')
  const [routes, setRoutes] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [distanceKm, setDistanceKm] = useState(null)
  const [pinMode, setPinMode] = useState(null)
  const [tempPin, setTempPin] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }
  }, [])

  const handleSourceChange = useCallback((e) => setSource(e.target.value), [])
  const handleDestinationChange = useCallback((e) => setDestination(e.target.value), [])
  const handleFindRoute = async () => {
    if (!source.trim() || !destination.trim()) {
      alert('Please enter both Source and Destination.')
      return
    }
    setLoading(true)
    try {
      const src = await geocodePlace(source)
      await sleep(600)
      const dst = await geocodePlace(destination)
      if (!src || !dst) {
        alert('Could not find one or both locations. Please refine your inputs.')
        setSourceCoord(null); setDestCoord(null)
        return
      }
      const srcC = { lat: src.lat, lon: src.lon, name: src.name }
      const dstC = { lat: dst.lat, lon: dst.lon, name: dst.name }
      setSourceCoord(srcC); setDestCoord(dstC)
      const dKm = haversineKm(srcC, dstC)
      setDistanceKm(dKm)
      let fetchedRoutes = []
      try { fetchedRoutes = await fetchRoutes(srcC, dstC, profile) } catch (e) { fetchedRoutes = [] }
      if (fetchedRoutes.length > 0) {
        const routesWithSafety = fetchedRoutes.map((r, idx) => {
          const s = calculateRouteSafety(source, destination, new Date())
          const routeDistanceKm = r.distanceKm || (r.distance ? r.distance / 1000 : dKm)
          const routeDurationSec = r.durationSec || r.duration || 0
          return { 
            ...r, 
            safety: s, 
            safetyScore: s.score, 
            safetyLevel: s.level, 
            color: s.color, 
            index: idx,
            distanceKm: routeDistanceKm,
            durationSec: routeDurationSec,
            distance: routeDistanceKm * 1000,
            duration: routeDurationSec
          }
        })
        let validRoutes = routesWithSafety.filter(r => Array.isArray(r.geometry) && r.geometry.length > 0)
        if (validRoutes.length === 0) {
          const safety = calculateRouteSafety(source, destination, new Date())
          validRoutes = [{ 
            geometry: [[srcC.lat, srcC.lon], [dstC.lat, dstC.lon]], 
            distanceKm: dKm, 
            durationSec: 0, 
            index: 0, 
            isFallback: true, 
            safety, 
            safetyScore: safety.score, 
            safetyLevel: safety.level, 
            color: safety.color 
          }]
        }
        validRoutes.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
        setRoutes(validRoutes)
        setSelectedRouteIndex(0)
        setSafetyInfo(validRoutes[0]?.safety || calculateRouteSafety(source, destination, new Date()))
      } else {
        const safety = calculateRouteSafety(source, destination, new Date())
        setSafetyInfo(safety)
        setRoutes([])
        setSelectedRouteIndex(0)
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      try { localStorage.clear() } catch(_){}
      window.location.href = '/login'
    }
  }

  const s = {
    page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' },
    header: { position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #e0e0e0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', zIndex: 1100 },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', marginLeft: 0 },
    brandBox: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 },
    brandText: { fontSize: 20, fontWeight: 800, color: '#111827' },
    avatarBtn: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    dropdown: { 
      position: 'fixed', 
      top: 'calc(12px + 40px + 12px)', /* header padding + avatar height + spacing */
      right: '16px', 
      width: '240px', 
      background: '#fff', 
      border: '1px solid #e0e0e0', 
      borderRadius: '12px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
      overflow: 'hidden', 
      zIndex: 10000 
    },
    userBox: { 
      background: '#f7f7f7', 
      padding: '14px', 
      borderBottom: '1px solid #e0e0e0' 
    },
    menuItem: { 
      width: '100%', 
      padding: '12px 16px', 
      background: 'transparent', 
      border: 'none', 
      textAlign: 'left', 
      cursor: 'pointer', 
      fontSize: '14px', 
      color: '#333' 
    },
    main: { display: 'flex', height: 'calc(100vh - 80px)', width: '100%', gap: '12px', padding: '12px', backgroundColor: '#f8f9fa', overflow: 'hidden', boxSizing: 'border-box' },
    left: { 
      width: '320px', 
      height: '100%', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '16px', 
      overflowY: 'auto', 
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', 
      flexShrink: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      boxSizing: 'border-box' 
    },
    h2: { 
      fontSize: '22px', 
      fontWeight: 800, 
      color: '#111827', 
      margin: 0,
      marginBottom: '4px' 
    },
    sub: { 
      color: '#6b7280', 
      fontSize: '13px',
      marginBottom: '16px' 
    },
    card: {
      background: 'white',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    tip: { 
      background: '#dcfce7', 
      borderLeft: '4px solid #10b981', 
      borderRadius: '8px', 
      padding: '12px', 
      color: '#047857', 
      fontSize: '13px',
      marginBottom: '16px'
    },
    modeBox: {
      background: '#f8f9fa',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      border: '1px solid #e0e0e0'
    },
    modeWarning: {
      background: '#fff3dc',
      color: '#92400e',
      padding: '8px',
      borderRadius: '6px',
      fontSize: '12px',
      marginTop: '8px'
    },
    inputLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
      marginBottom: '12px',
      fontSize: '14px'
    },
    findButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      background: '#10b981',
      color: 'white',
      fontWeight: 600,
      marginBottom: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    contactTitle: { 
      fontWeight: 700, 
      color: '#111827',
      marginBottom: '4px'
    },
    contactCard: {
      background: '#f8f9fa',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginTop: '8px'
    }
  }

  const initial = (user?.name || user?.email || 'U')?.trim()?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div style={s.page} className="app">
      <div style={s.header}>
        <div style={s.headerRow}>
          <div style={s.brand}>
            <div style={s.brandBox}>S</div>
            <div style={s.brandText}>SafeWay</div>
          </div>
          <div ref={menuRef} style={{ position: 'relative', padding: '0 16px', marginRight: 0, zIndex: 10000 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={s.avatarBtn}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.email || 'Account'}
            >
              {initial}
            </button>
            {menuOpen && (
              <div style={{
                ...s.dropdown,
                position: 'fixed',
                top: '64px', // Header height
                right: '16px',
              }}>
                <div style={{
                  ...s.userBox,
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{user?.email || 'user@example.com'}</div>
                </div>
                <button style={s.menuItem}>👤 Profile</button>
                <button style={s.menuItem}>⚙️ Settings</button>
                <div style={{ height: '1px', background: '#e0e0e0', margin: '6px 0' }} />
                <button style={{ ...s.menuItem, color: '#DC2626', fontWeight: 700 }} onClick={handleLogout}>🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.left} className="inline-controls">
          <div style={s.card}>
            <h2 style={s.h2}>Find Safe Way</h2>
            <div style={s.sub}>Plan your journey safely</div>
          </div>
          
          <div style={s.modeBox}>
            <RouteInputs
              source={source}
              destination={destination}
              setSource={setSource}
              setDestination={setDestination}
              onSubmit={handleFindRoute}
              profile={profile}
              setProfile={setProfile}
              distanceKm={distanceKm}
              loading={loading}
              error={''}
              onDropPinClick={setPinMode}
            />
            {profile === 'cycling' && (
              <div style={s.modeWarning}>
                ⚠️ Cycling routes are in beta and may have limited coverage in some areas
              </div>
            )}
          </div>

          <div style={s.tip}>
            <div style={{ fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>ℹ️ Safety Tip</div>
            <div style={{ marginTop: '6px' }}>Share your route with trusted contacts before you leave</div>
          </div>

          <div style={s.card}>
            <div style={s.contactTitle}>Emergency Contacts</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Your emergency contacts will be notified if you trigger SOS</div>
            <div style={s.contactCard}>
              <div style={{ fontSize: '13px', color: '#4b5563' }}>Add emergency contacts to enable SOS alerts</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} className="embedded-map">
          <div style={{ flex: 1, height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <MapView
              sourceCoord={sourceCoord}
              destCoord={destCoord}
              safetyInfo={safetyInfo}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              onRouteSelect={setSelectedRouteIndex}
              pinMode={pinMode}
              handlePinDrop={async (coords) => {
                if (!pinMode) return
                if (pinMode === 'source') {
                  setTempPin(coords)
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
                    const data = await res.json()
                    const name = data.display_name || `Location (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
                    setSource(name)
                    setSourceCoord({ lat: coords.lat, lon: coords.lon, name })
                  } finally { setPinMode(null); setTempPin(null) }
                } else if (pinMode === 'destination') {
                  setTempPin(coords)
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
                    const data = await res.json()
                    const name = data.display_name || `Location (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`
                    setDestination(name)
                    setDestCoord({ lat: coords.lat, lon: coords.lon, name })
                  } finally { setPinMode(null); setTempPin(null) }
                }
              }}
              tempPin={tempPin}
              setPinMode={setPinMode}
            />

            {routes.length === 0 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxWidth: '280px', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center', animation: 'slideIn 0.3s ease-out' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>Ready to Find Safe Ways</h3>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Enter source and destination to get started</p>
              </div>
            )}
          </div>

          {safetyInfo && routes.length > 0 && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', zIndex: 1001, backdropFilter: 'blur(6px)', border: '1px solid rgba(0, 0, 0, 0.08)', maxWidth: '260px', minWidth: '220px', pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: safetyInfo.color || '#FFA500', color: 'white', padding: '3px 8px', borderRadius: '4px' }}>
                  {safetyInfo.level?.toUpperCase() || 'MODERATE'}
                </span>
                <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `4px solid ${safetyInfo.color || '#FFA500'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: safetyInfo.color || '#FFA500', flexShrink: 0 }}>
                  {safetyInfo.score || '54'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>Safety Score</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Out of 100</div>
                </div>
              </div>

              <SafetyInfo safety={safetyInfo} />
            </div>
          )}
        </div>
      </div>

      {routes.length > 0 && (
        <div style={{ position: 'fixed', top: 'auto', bottom: '20px', left: '360px', width: '280px', zIndex: 400, pointerEvents: 'auto', backgroundColor: '#E3F2FD', borderRadius: '8px', padding: '12px', border: '1px solid #90CAF9', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(6px)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1565C0' }}>Choose Your Route</h4>
          <RouteOptions
            routes={routes}
            selectedIndex={selectedRouteIndex}
            onSelect={(i) => {
              setSelectedRouteIndex(i)
              const r = routes[i]
              if (r?.safety) setSafetyInfo(r.safety)
            }}
          />
        </div>
      )}

      <SOSModal />
    </div>
  )
}