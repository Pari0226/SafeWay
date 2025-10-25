function mins(sec) { return Math.round((sec || 0) / 60) }

function RouteOptions({ routes = [], selectedIndex = 0, onSelect }) {
  if (!routes || routes.length === 0) return null

  const maxSafety = Math.max(...routes.map(r => (r.safetyScore ?? r.safety?.score ?? 0)))

  return (
    <div className="route-options">
      <h3>Choose Your Route</h3>
      {routes.map((route, index) => {
        const isSelected = index === selectedIndex
        const isSafest = (route.safetyScore ?? route.safety?.score ?? 0) === maxSafety
        const distanceKm = route.distanceKm ?? (route.distance ? route.distance / 1000 : 0)
        const durationMin = route.durationSec ? mins(route.durationSec) : mins(route.duration)
        const safetyLevel = (route.safetyLevel || route.safety?.level || '').toLowerCase()
        return (
          <div
            key={index}
            className={`route-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect && onSelect(index)}
          >
            <div className="route-header">
              <span className="route-number">Route {index + 1}</span>
              {isSafest && <span className="badge recommended">🛡️ Safest</span>}
              {index === 0 && !isSafest && <span className="badge">⚡ Fastest</span>}
            </div>

            <div className="route-stats">
              <div className="stat">
                <span className="label">Distance</span>
                <span className="value">{distanceKm.toFixed(1)} km</span>
              </div>
              <div className="stat">
                <span className="label">Duration</span>
                <span className="value">{durationMin} min</span>
              </div>
              <div className="stat">
                <span className={`value safety-${safetyLevel}`}>{route.safetyScore ?? route.safety?.score ?? '—'}</span>
                <span className="label">Safety</span>
              </div>
            </div>

            <div
              className="route-color-bar"
              style={{
                backgroundColor: route.color || '#94a3b8',
                height: '4px',
                borderRadius: '2px',
                marginTop: '8px',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default RouteOptions
