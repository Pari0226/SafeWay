function formatKm(km) {
  return `${km.toFixed(1)} km`
}

function formatDuration(seconds) {
  const m = Math.round(seconds / 60)
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm}m`
  return `${h}h ${mm}m`
}

function RouteCard({ route, index, isSelected, onSelect }) {
  const color = route.safety?.color || '#059669'
  return (
    <div
      className={`route-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(index)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(index) }}
    >
      <div className="route-card-header">
        <div className="route-title">Route {index + 1}</div>
        {isSelected && <span className="badge badge-rec">Recommended</span>}
      </div>
      <div className="route-metrics">
        <div className="metric"><span className="metric-label">Distance</span><span>{formatKm(route.distanceKm || 0)}</span></div>
        <div className="metric"><span className="metric-label">Duration</span><span>{formatDuration(route.durationSec || 0)}</span></div>
      </div>
      <div className="route-safety">
        <span className="safety-dot" style={{ background: color }} />
        <span className="safety-score">{route.safety?.score ?? '—'}</span>
        <span className="safety-level">{route.safety?.level?.toUpperCase() || ''}</span>
      </div>
    </div>
  )
}

function RouteComparison({ routes = [], selectedIndex = 0, onSelect, loading = false }) {
  if (!routes.length && !loading) return null
  return (
    <div className="route-comparison">
      {loading && <div className="muted">Loading routes…</div>}
      <div className="route-list">
        {routes.map((r, i) => (
          <RouteCard
            key={i}
            route={r}
            index={i}
            isSelected={i === selectedIndex}
            onSelect={onSelect}
          />)
        )}
      </div>
    </div>
  )
}

export default RouteComparison
