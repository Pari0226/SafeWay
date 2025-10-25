function RouteSelector({ profile, setProfile, distanceKm }) {
  return (
    <div className="route-selector" role="radiogroup" aria-label="Route Type">
      <label className={`route-option ${profile === 'driving-car' ? 'checked' : ''}`}>
        <input
          type="radio"
          name="route-profile"
          value="driving-car"
          checked={profile === 'driving-car'}
          onChange={() => setProfile('driving-car')}
        />
        <span className="route-icon">🚗</span>
        <span>Driving</span>
      </label>
      <label className={`route-option ${profile === 'foot-walking' ? 'checked' : ''}`}>
        <input
          type="radio"
          name="route-profile"
          value="foot-walking"
          checked={profile === 'foot-walking'}
          onChange={() => setProfile('foot-walking')}
        />
        <span className="route-icon">🚶</span>
        <span>Walking</span>
      </label>
      <label className={`route-option ${profile === 'cycling-regular' ? 'checked' : ''}`}>
        <input
          type="radio"
          name="route-profile"
          value="cycling-regular"
          checked={profile === 'cycling-regular'}
          onChange={() => setProfile('cycling-regular')}
        />
        <span className="route-icon">🚴</span>
        <span>Cycling</span>
      </label>
      <div className="route-tip muted" style={{ width: '100%' }}>
        {typeof distanceKm === 'number' ? (
          <>
            Distance: {distanceKm.toFixed(1)} km · {distanceKm < 5 ? '⚠️ Walking ideal < 5km' : distanceKm < 15 ? '⚠️ Walking ok < 15km' : distanceKm < 60 ? '⚠️ Cycling best < 60km' : 'Driving recommended'}
          </>
        ) : (
          <>Choose a mode. ⚠️ Walking ideal &lt; 5km</>
        )}
      </div>
    </div>
  )
}

export default RouteSelector
