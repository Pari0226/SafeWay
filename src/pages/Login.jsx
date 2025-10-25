import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(formData.email, formData.password)
      if (result && result.data) {
        // Extract data from the nested structure
        const { token, user } = result.data
        
        // Save to localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Use window.location for a full page refresh
        window.location.href = '/'
      } else {
        setError(result?.message || 'Invalid login response')
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred during login.')
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
    stats: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
    statCard: {
      background: 'rgba(255,255,255,0.16)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 12,
      padding: 12,
      backdropFilter: 'blur(2px)'
    },
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
    forgotRow: { display: 'flex', justifyContent: 'flex-end', marginTop: 6 },
    forgot: { color: '#10b981', fontSize: 13, textDecoration: 'none' },
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
    footer: { marginTop: 16, textAlign: 'center', color: '#6b7280', fontSize: 14 },
    link: { color: '#10b981', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }
  }

  // Focus styling helpers
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusPass, setFocusPass] = useState(false)

  return (
    <div style={styles.page}>
      {/* Scoped responsive CSS to hide left on small screens */}
      <style>{`
        @media (max-width: 1024px) { .login-left { display: none !important; }
          .login-right { width: 100% !important; }
        }
      `}</style>

      {/* LEFT SIDE */}
      <div className="login-left" style={styles.left}>
        <div>
          <div style={styles.brandRow}>
            <div style={styles.brandBox}><span style={styles.brandText}>S</span></div>
            <div>
              <div style={styles.appName}>SafeWay</div>
              <div style={styles.tagline}>Your Women Safety Companion</div>
            </div>
          </div>
          <div style={styles.leftBody}>
            <div style={styles.headline}>Welcome back to safety</div>
            <div style={styles.subcopy}>Discover safer routes, share your live location, and get help when you need it.</div>
          </div>
        </div>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>+120k</div>
            <div style={{ opacity: 0.9, fontSize: 12 }}>Alerts delivered</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>98.9%</div>
            <div style={{ opacity: 0.9, fontSize: 12 }}>Uptime</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>24/7</div>
            <div style={{ opacity: 0.9, fontSize: 12 }}>Support</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right" style={styles.right}>
        <div style={styles.card}>
          <div>
            <h1 style={styles.h1}>Welcome Back</h1>
            <p style={styles.sub}>Sign in to your account</p>
          </div>

          {error ? (
            <div style={styles.error}>{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={styles.label}>Email Address</label>
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

            <div style={{ marginBottom: 6 }}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusPass(true)}
                onBlur={() => setFocusPass(false)}
                placeholder="••••••••"
                style={{ ...styles.input, ...(focusPass ? styles.inputFocus : null) }}
              />
            </div>

            <div style={styles.forgotRow}>
              <a href="#" style={styles.forgot}>Forgot password?</a>
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={styles.footer}>
            Don't have an account?
            <Link to="/register" style={styles.link}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
