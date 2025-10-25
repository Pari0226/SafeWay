import { useState } from 'react'

const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false)

  const handleSOS = () => {
    setIsPressed(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const message = `🚨 EMERGENCY! Location: https://www.google.com/maps?q=${latitude},${longitude}`
          // eslint-disable-next-line no-alert
          alert(`SOS Alert!\n\nYour location:\n${message}\n\nIn production, this would send SMS to emergency contacts.`)
          // eslint-disable-next-line no-console
          console.log('SOS Triggered:', { latitude, longitude, timestamp: new Date().toISOString() })
          setTimeout(() => setIsPressed(false), 3000)
        },
        () => {
          // eslint-disable-next-line no-alert
          alert('Unable to get location. Please enable location services.')
          setIsPressed(false)
        }
      )
    } else {
      // eslint-disable-next-line no-alert
      alert('Geolocation not supported')
      setIsPressed(false)
    }
  }

  return (
    <button
      onClick={handleSOS}
      disabled={isPressed}
      title="Emergency SOS"
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9998,
        width: 64,
        height: 64,
        borderRadius: 9999,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 18,
        border: 'none',
        cursor: isPressed ? 'default' : 'pointer',
        boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
        background: isPressed ? '#f59e0b' : 'linear-gradient(90deg,#ef4444,#ec4899)'
      }}
    >
      {isPressed ? '...' : 'SOS'}
    </button>
  )
}

export default SOSButton
