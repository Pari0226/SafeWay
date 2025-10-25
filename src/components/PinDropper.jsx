import React from 'react'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

function PinDropper({ mode, onPinDrop, tempPin }) {
  useMapEvents({
    click(e) {
      if (mode) {
        const { lat, lng } = e.latlng
        onPinDrop && onPinDrop({ lat, lon: lng })
      }
    }
  })

  const pinIcon = L.divIcon({
    html: '<div style="font-size: 32px; margin-top: -32px; margin-left: -12px;">📍</div>',
    className: 'custom-pin',
    iconSize: [24, 32],
    iconAnchor: [12, 32]
  })

  if (!tempPin) return null

  return (
    <Marker position={[tempPin.lat, tempPin.lon]} icon={pinIcon}>
      <Popup>
        <strong>{mode === 'source' ? 'Source Location' : 'Destination'}</strong>
        <div>Lat: {tempPin.lat.toFixed(5)}</div>
        <div>Lon: {tempPin.lon.toFixed(5)}</div>
      </Popup>
    </Marker>
  )
}

export default PinDropper
