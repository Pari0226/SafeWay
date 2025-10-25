import { useEffect, useMemo, useRef, useState } from 'react'

function formatCoords(coords) {
  if (!coords) return ''
  const { lat, lon } = coords
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

function EmergencyModal({ isOpen, onClose }) {
  const overlayRef = useRef(null)
  const [locLoading, setLocLoading] = useState(false)
  const [location, setLocation] = useState(null) // { lat, lon }
  const [locError, setLocError] = useState('')

  const [contacts, setContacts] = useState([]) // {id, name, phone}
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')

  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState('')

  const mapsLink = useMemo(() => {
    if (!location) return ''
    return `https://www.google.com/maps?q=${location.lat},${location.lon}`
  }, [location])

  // Global key listener on mount/unmount (not conditional)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // When modal opens: reset and fetch location
  useEffect(() => {
    if (!isOpen) return
    setSentMsg('')
    setFormError('')
    setLocLoading(true)
    setLocError('')
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setLocation({ lat: latitude, lon: longitude })
          setLocLoading(false)
        },
        (err) => {
          setLocError(err.message || 'Unable to get location')
          setLocLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      )
    } else {
      setLocError('Geolocation is not supported by this browser')
      setLocLoading(false)
    }
  }, [isOpen])

  const clickOverlay = (e) => {
    if (e.target === overlayRef.current) onClose?.()
  }

  const validateAndAdd = () => {
    const trimmedName = name.trim()
    const digits = phone.trim()
    if (!trimmedName || !/^\d{10}$/.test(digits)) {
      setFormError('Enter a valid name and 10-digit phone number')
      return
    }
    const id = Date.now().toString()
    setContacts((prev) => [...prev, { id, name: trimmedName, phone: digits }])
    setName('')
    setPhone('')
    setFormError('')
  }

  const removeContact = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const messagePreview = useMemo(() => {
    const coordsTxt = location ? formatCoords(location) : 'Unknown'
    const link = location ? mapsLink : ''
    return `🚨 EMERGENCY! I need help. My location: ${coordsTxt} ${link}`
  }, [location, mapsLink])

  const sendAlert = async () => {
    setSending(true)
    console.log('Sending emergency alert to contacts:', contacts)
    console.log('Message:', messagePreview)
    // Simulate delay
    await new Promise((r) => setTimeout(r, 800))
    const count = contacts.length
    setSentMsg(`Alert sent to ${count} contact${count === 1 ? '' : 's'}.`)
    setSending(false)
    setTimeout(() => {
      onClose?.()
      setSentMsg('')
    }, 2000)
  }

  const copyLocation = async () => {
    try {
      await navigator.clipboard?.writeText(messagePreview)
    } catch (e) {
      // ignore if clipboard unsupported
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" ref={overlayRef} onMouseDown={clickOverlay}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <span>🚨 Emergency</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <h3 className="section-title">Your Location</h3>
          {locLoading && <div className="status loading">Getting your location…</div>}
          {locError && <div className="status error">{locError}</div>}
          {!locLoading && !locError && location && (
            <div className="location-row">
              <div className="coords">{formatCoords(location)}</div>
              <button className="secondary-btn" onClick={copyLocation}>Copy Location</button>
            </div>
          )}
        </div>

        <div className="modal-section">
          <h3 className="section-title">Emergency Contacts</h3>
          {contacts.length === 0 ? (
            <div className="muted">No contacts added yet.</div>
          ) : (
            <ul className="contacts-list">
              {contacts.map((c) => (
                <li key={c.id} className="contact-item">
                  <div>
                    <div className="contact-name">{c.name}</div>
                    <div className="contact-phone">{c.phone}</div>
                  </div>
                  <button className="danger-btn" onClick={() => removeContact(c.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          <div className="contact-form">
            <input
              type="text"
              placeholder="Name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="tel"
              placeholder="Phone (10 digits)"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="primary-btn" onClick={validateAndAdd}>Add Contact</button>
          </div>
          {formError && <div className="status error">{formError}</div>}
        </div>

        <div className="modal-section">
          <h3 className="section-title">Helpline Numbers</h3>
          <div className="helplines">
            <div>Women Helpline: <strong>1091</strong></div>
            <div>Police: <strong>100</strong></div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="primary-btn" onClick={sendAlert} disabled={sending}>
            {sending ? 'Sending…' : 'Send Alert Now'}
          </button>
          <button className="secondary-btn" onClick={onClose} disabled={sending}>Cancel</button>
        </div>

        <div className="modal-preview">
          <div className="muted">Alert Preview</div>
          <div className="preview-box">{messagePreview}</div>
          {sentMsg && <div className="status success">{sentMsg}</div>}
        </div>
      </div>
    </div>
  )
}

export default EmergencyModal
