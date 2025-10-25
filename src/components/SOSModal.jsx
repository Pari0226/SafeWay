import { useState, useEffect } from 'react'
import { sosAPI } from '../services/api'

const SOSModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [location, setLocation] = useState(null)
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    fetchContacts()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error('Location error:', error)
          // eslint-disable-next-line no-alert
          alert('Unable to get location. Please enable location services.')
        }
      )
    }
  }, [isOpen])

  const fetchContacts = async () => {
    try {
      const res = await sosAPI.getContacts()
      setContacts(res.data.data || [])
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch contacts:', e)
    }
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      // eslint-disable-next-line no-alert
      alert('Please enter name and phone number')
      return
    }
    setLoading(true)
    try {
      const res = await sosAPI.addContact({
        name: newContact.name,
        phone: newContact.phone,
        relation: newContact.relation || 'Friend'
      })
      if (res.data?.success) {
        await fetchContacts()
        setNewContact({ name: '', phone: '', relation: '' })
        setShowAddForm(false)
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.response?.data?.error || 'Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveContact = async (id) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await sosAPI.deleteContact(id)
      await fetchContacts()
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.response?.data?.error || 'Failed to delete contact')
    }
  }

  const handleSendAlert = async () => {
    if (!location) {
      // eslint-disable-next-line no-alert
      alert('Getting your location...')
      return
    }
    if (contacts.length === 0) {
      // eslint-disable-next-line no-alert
      alert('Please add at least one emergency contact first!')
      return
    }

    const tokenPresent = !!localStorage.getItem('token')
    // eslint-disable-next-line no-console
    console.log('Sending SOS request...', { tokenPresent, latitude: location.lat, longitude: location.lng })

    setLoading(true)
    try {
      const resp = await sosAPI.triggerAlert({
        latitude: location.lat,
        longitude: location.lng,
        message: '🚨 EMERGENCY! I need help immediately!'
      })
      // eslint-disable-next-line no-console
      console.log('SOS API response:', resp.data)
      if (resp.data?.success) {
        const sentTo = resp.data.data?.sentTo?.length || 0
        // eslint-disable-next-line no-alert
        alert(`✅ SOS Alert sent successfully to ${sentTo} contact(s)!`)
        setIsOpen(false)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('SOS error:', e)
      // eslint-disable-next-line no-alert
      alert(e.response?.data?.error || 'Failed to send SOS alert. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyLocation = () => {
    if (location) {
      const text = `${location.lat}, ${location.lng}` 
      navigator.clipboard.writeText(text)
      // eslint-disable-next-line no-alert
      alert('Location copied to clipboard!')
    }
  }

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 9999,
          width: 84,
          height: 84,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 0.5,
          cursor: 'pointer',
          boxShadow: '0 0 22px rgba(239,68,68,0.6), 0 0 44px rgba(239,68,68,0.4)',
          transition: 'transform 0.25s ease, filter 0.25s ease',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.filter = 'brightness(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)' ; setTimeout(() => { try { e.currentTarget.style.transform = 'scale(1)' } catch(_){} }, 120) }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.85), 0 0 0 6px rgba(59,130,246,0.45), 0 0 30px rgba(239,68,68,0.6)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = '0 0 22px rgba(239,68,68,0.6), 0 0 44px rgba(239,68,68,0.4)'; }}
        title="Emergency SOS"
        aria-label="Emergency SOS Alert"
      >
        SOS
      </button>

      {/* Inline keyframes for glowing pulse */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 32px rgba(239, 68, 68, 0.8), 0 0 64px rgba(239, 68, 68, 0.6);
          }
        }
      `}</style>

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #fee2e2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                  Emergency
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                ×
              </button>
            </div>

            {/* Your Location */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Your Location
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px'
              }}>
                <span style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace' }}>
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Getting location...'}
                </span>
                {location && (
                  <button
                    onClick={copyLocation}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Copy Location
                  </button>
                )}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                Emergency Contacts
              </h3>
              {contacts.map(contact => (
                <div key={contact.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{contact.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>{contact.phone}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {showAddForm ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  marginTop: '8px'
                }}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (10 digits)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleAddContact}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Add Contact
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginTop: '8px'
                  }}
                >
                  + Add Contact
                </button>
              )}
            </div>

            {/* Helpline Numbers */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Helpline Numbers
              </h3>
              <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                <div><strong>Women Helpline:</strong> 1091</div>
                <div><strong>Police:</strong> 100</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSendAlert}
                disabled={!location}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: location ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : '#d1d5db',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: location ? 'pointer' : 'not-allowed'
                }}
              >
                Send Alert Now
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>

            {/* Alert Preview */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#991b1b'
            }}>
              <strong>Alert Preview:</strong>
              <div style={{ marginTop: '4px' }}>
                🚨 EMERGENCY! I need help. My location: {location ? 
                  `https://www.google.com/maps?q=${location.lat},${location.lng}` : 
                  'Getting location...'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SOSModal
