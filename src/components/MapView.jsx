import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from 'react-leaflet'
import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import PinDropper from './PinDropper'

const indiaCenter = [20.5937, 78.9629]
const DEFAULT_CENTER = [25.3176, 82.9739] // Varanasi
const DEFAULT_ZOOM = 13

function FitToRoute({ sourceCoord, destCoord }) {
  const map = useMap()
  useEffect(() => {
    if (sourceCoord && destCoord) {
      const bounds = [
        [sourceCoord.lat, sourceCoord.lon],
        [destCoord.lat, destCoord.lon],
      ]
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, sourceCoord, destCoord])
  return null
}

function FitToGeometry({ geometry }) {
  const map = useMap()
  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry.map(([lat, lon]) => [lat, lon]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, geometry])
  return null
}

function MapView({ sourceCoord, destCoord, safetyInfo, routes = [], selectedRouteIndex = 0, onRouteSelect, pinMode, handlePinDrop, tempPin, setPinMode }) {
  const hasRoute = !!(sourceCoord && destCoord)
  // Debug: what did we receive
  // eslint-disable-next-line no-console
  console.log('MapView received:', { sourceCoord, destCoord, routes })
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('MapView mounted!')
  }, [])
  const { greenIcon, redIcon } = useMemo(() => {
    const common = {
      html: '<div class="marker-dot"></div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    }
    return {
      greenIcon: L.divIcon({ ...common, className: 'marker-dot marker-green' }),
      redIcon: L.divIcon({ ...common, className: 'marker-dot marker-red' }),
    }
  }, [])
  const routeColor = safetyInfo?.color || '#059669'
  const routeWeight = safetyInfo ? 6 : 4
  const hasRoutes = Array.isArray(routes) && routes.length > 0
  const safeIndex = hasRoutes && selectedRouteIndex >= 0 && selectedRouteIndex < routes.length ? selectedRouteIndex : 0
  const selected = hasRoutes ? routes[safeIndex] : null
  const selectedGeom = Array.isArray(selected?.geometry) ? selected.geometry : []
  const mapCenter = sourceCoord ? [sourceCoord.lat, sourceCoord.lon] : DEFAULT_CENTER
  const mapZoom = hasRoutes ? 14 : DEFAULT_ZOOM
  // eslint-disable-next-line no-console
  console.log('Map will center at:', mapCenter, 'zoom:', mapZoom)
  // Debug drawing info
  // eslint-disable-next-line no-console
  console.log('Drawing route:', {
    hasRoutes,
    selectedIndex: safeIndex,
    geometryLength: selectedGeom.length,
    firstPoint: selectedGeom[0],
    lastPoint: selectedGeom[selectedGeom.length - 1]
  })

  // Toggle crosshair cursor when pin mode is active
  useEffect(() => {
    const container = document.querySelector('.leaflet-container')
    if (!container) return
    if (pinMode) container.classList.add('pin-mode-active')
    else container.classList.remove('pin-mode-active')
  }, [pinMode])

  return (
    <div className="map-wrapper">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw all routes; selected highlighted */}
        {hasRoutes && routes.map((r, idx) => {
          const geom = Array.isArray(r.geometry) ? r.geometry : []
          const isSelected = idx === safeIndex
          const color = isSelected ? (r.color || routeColor) : '#94a3b8'
          const weight = isSelected ? 6 : 4
          const opacity = isSelected ? 1 : 0.5
          return (
            <Polyline
              key={`route-${idx}`}
              positions={geom}
              pathOptions={{ color, weight, opacity }}
              eventHandlers={onRouteSelect ? { click: () => onRouteSelect(idx) } : undefined}
            />
          )
        })}

        {/* Start/End markers and fit for selected route */}
        {hasRoutes && selectedGeom.length > 0 && (
          <>
            <Marker position={selectedGeom[0]} icon={greenIcon}>
              <Popup>
                <strong>Start</strong>
                <div>{sourceCoord?.name}</div>
              </Popup>
            </Marker>
            <Marker position={selectedGeom[selectedGeom.length - 1]} icon={redIcon}>
              <Popup>
                <strong>End</strong>
                <div>{destCoord?.name}</div>
              </Popup>
            </Marker>
            <FitToGeometry geometry={selectedGeom} />
          </>
        )}

        {/* Fallback: straight line if no routing */}
        {!hasRoutes && hasRoute && (
          <>
            <Polyline
              positions={[[sourceCoord.lat, sourceCoord.lon], [destCoord.lat, destCoord.lon]]}
              pathOptions={{ color: '#F59E0B', weight: 4 }}
            />
            <Marker position={[sourceCoord.lat, sourceCoord.lon]} icon={greenIcon}>
              <Popup>
                <strong>Source</strong>
                <div>{sourceCoord.name}</div>
              </Popup>
            </Marker>
            <Marker position={[destCoord.lat, destCoord.lon]} icon={redIcon}>
              <Popup>
                <strong>Destination</strong>
                <div>{destCoord.name}</div>
              </Popup>
            </Marker>
            <FitToRoute sourceCoord={sourceCoord} destCoord={destCoord} />
          </>
        )}

        {/* Pin dropper */}
        <PinDropper mode={pinMode} onPinDrop={handlePinDrop} tempPin={tempPin} />
      </MapContainer>

      {!hasRoutes && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center', zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Ready to Find Safe Ways</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>Enter source and destination to get started</p>
        </div>
      )}
      {hasRoute && safetyInfo && (
        <div className="safety-badge" title={`Safety score: ${safetyInfo.score}`}>
          <span className="badge-dot" style={{ background: safetyInfo.color }}></span>
          <span className="badge-score">{safetyInfo.score}</span>
          <span className="badge-level">{safetyInfo.level.toUpperCase()}</span>
        </div>
      )}

      {/* Pin mode instruction overlay */}
      {pinMode && (
        <div className="pin-mode-overlay">
          <div className="pin-instruction">
            <span>📍 Click on map to set {pinMode === 'source' ? 'source' : 'destination'} location</span>
            <button onClick={() => setPinMode(null)} className="cancel-pin-btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
