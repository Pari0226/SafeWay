import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await register(formData)
      if (result.success) {
        // Full reload to ensure auth state is initialized similarly to login flow
        window.location.href = '/'
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: '#f3f4f6'
    },
    left: {
      flex: '1 1 0%',
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px',
    },
    brandRow: { display: 'flex', alignItems: 'center', gap: 12 },
    brandBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.35)'
    },
    brandText: { fontSize: 22, fontWeight: 800, letterSpacing: 0.2 },
    appName: { fontSize: 28, fontWeight: 800 },
    tagline: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },
    leftBody: { marginTop: 64, maxWidth: 520 },
    headline: { fontSize: 40, fontWeight: 800, lineHeight: 1.1 },
    subcopy: { marginTop: 12, opacity: 0.95 },
    right: {
      flex: '1 1 0%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: '#f3f4f6'
    },
    card: {
      width: '100%',
      maxWidth: 420,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
      padding: 28,
      overflow: 'hidden',
      boxSizing: 'border-box'
    },
    h1: { fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 },
    sub: { color: '#6b7280', marginTop: 6 },
    error: {
      margin: '16px 0',
      padding: 12,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 10,
      color: '#b91c1c',
      fontSize: 14
    },
    label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 },
    input: {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: 10,
      fontSize: 15,
      outline: 'none',
      transition: 'border-color .2s, box-shadow .2s',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 4px rgba(16,185,129,0.15)'
    },
    button: {
      width: '100%',
      border: 'none',
      padding: 12,
      borderRadius: 12,
      color: '#fff',
      fontWeight: 700,
      background: 'linear-gradient(90deg, #34d399, #059669)',
      cursor: 'pointer',
      transition: 'transform .06s ease, filter .2s ease'
    },
    link: { color: '#10b981', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }
  }

  const [focusName, setFocusName] = useState(false)
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusPhone, setFocusPhone] = useState(false)
  const [focusPass, setFocusPass] = useState(false)

  return (
    <div style={styles.page}>
      <style>{`@media (max-width: 1024px) { .reg-left { display: none !important; } .reg-right { width: 100% !important; } }`}</style>

      <div className="reg-left" style={styles.left}>
        <div>
          <div style={styles.brandRow}>
            <div style={styles.brandBox}><span style={styles.brandText}>S</span></div>
            <div>
              <div style={styles.appName}>SafeWay</div>
              <div style={styles.tagline}>Women Safety Companion</div>
            </div>
          </div>
          <div style={styles.leftBody}>
            <div style={styles.headline}>Join the community</div>
            <div style={styles.subcopy}>Sign up to discover safer routes and features built to protect you.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <div style={{ ...styles.card, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>50+ Risk Zones Mapped</div>
            <div style={{ opacity: 0.9, fontSize: 11 }}>Based on incident density</div>
          </div>
          <div style={{ ...styles.card, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>98.9%</div>
            <div style={{ opacity: 0.9, fontSize: 11 }}>Uptime</div>
          </div>
          <div style={{ ...styles.card, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>24/7</div>
            <div style={{ opacity: 0.9, fontSize: 11 }}>Support</div>
          </div>
        </div>
      </div>

      <div className="reg-right" style={styles.right}>
        <div style={styles.card}>
          <div>
            <h1 style={styles.h1}>Create Account</h1>
            <p style={styles.sub}>Join SafeWay today</p>
          </div>

          {error ? (
            <div style={styles.error}>{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusName(true)}
                onBlur={() => setFocusName(false)}
                placeholder="Enter your full name"
                style={{ ...styles.input, ...(focusName ? styles.inputFocus : null) }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
                placeholder="Enter your email"
                style={{ ...styles.input, ...(focusEmail ? styles.inputFocus : null) }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                required
                pattern="[6-9]\d{9}"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onFocus={() => setFocusPhone(true)}
                onBlur={() => setFocusPhone(false)}
                placeholder="Enter phone number"
                style={{ ...styles.input, ...(focusPhone ? styles.inputFocus : null) }}
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusPass(true)}
                onBlur={() => setFocusPass(false)}
                placeholder="••••••••"
                style={{ ...styles.input, ...(focusPass ? styles.inputFocus : null) }}
              />
              <p style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.button}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p style={{ marginTop: 16, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
