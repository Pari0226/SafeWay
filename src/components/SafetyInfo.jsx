import { formatCurrentTime } from '../utils/safetyScoring.js'

function SafetyInfo({ safety }) {
  if (!safety) return null
  const { score, level, color, factors } = safety

  const recommendation = (() => {
    if (score >= 80) return 'This route looks generally safe. Stay aware and follow standard precautions.'
    if (score >= 50) return 'Moderate safety. Prefer well-lit, busier roads and consider sharing live location.'
    return 'Risky conditions detected. Consider an alternative route or postpone travel if possible.'
  })()

  return (
    <div className="safety-card" role="status" aria-live="polite">
      {/* FACTORS ONLY - Score circle is shown separately in Dashboard */}
      <div className="factors" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="factor" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '14px' }}>🛡️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>Crime & Safety</div>
            <div style={{ color: '#666', fontSize: '11px' }}>Crime score: {factors.crime} • Women/Night influence included</div>
          </div>
        </div>

        <div className="factor" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '14px' }}>🕒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>Time of Day</div>
            <div style={{ color: '#666', fontSize: '11px' }}>Time score: {factors.time}</div>
          </div>
        </div>

        <div className="factor" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '14px' }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>Area Type</div>
            <div style={{ color: '#666', fontSize: '11px' }}>Area score: {factors.area}</div>
          </div>
        </div>

        <div className="factor" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
          <span style={{ fontSize: '14px' }}>👥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>Density</div>
            <div style={{ color: '#666', fontSize: '11px' }}>Density score: {factors.density}</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDATION */}
      <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#f0f4f8', borderRadius: '6px', fontSize: '11px', color: '#333', lineHeight: '1.4', borderLeft: `3px solid ${color}` }}>
        {recommendation}
      </div>
    </div>
  )
}

export default SafetyInfo