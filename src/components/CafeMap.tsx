import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { divIcon, latLngBounds } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { Cafe } from '../types/cafe'
import AddressSearch from './AddressSearch'
import type { BerlinAddress } from '../lib/address-search'

interface CafeMapProps {
  cafes: Cafe[]
  onSelect: (cafe: Cafe) => void
  selectedId?: string
  compact?: boolean
}

const BERLIN: [number, number] = [52.52, 13.405]

function MapViewport({ cafes, selectedId, address }: Pick<CafeMapProps, 'cafes' | 'selectedId'> & { address: BerlinAddress | null }) {
  const map = useMap()
  const coordinates = cafes.map(cafe => `${cafe.id}:${cafe.lat}:${cafe.lng}`).join('|')

  useEffect(() => {
    if (address) {
      map.setView([address.lat, address.lng], 17, { animate: false })
    } else if (cafes.length) {
      map.fitBounds(latLngBounds(cafes.map(cafe => [cafe.lat, cafe.lng])), {
        padding: [45, 45], maxZoom: 14, animate: false,
      })
    } else {
      map.setView(BERLIN, 12, { animate: false })
    }
    // The coordinate signature prevents unrelated parent renders from resetting the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordinates, address])

  useEffect(() => {
    const selected = cafes.find(cafe => cafe.id === selectedId)
    if (selected) map.panTo([selected.lat, selected.lng])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId])

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(container)
    map.invalidateSize({ pan: false })
    return () => observer.disconnect()
  }, [map])

  return null
}

export default function CafeMap({ cafes, onSelect, selectedId, compact = false }: CafeMapProps) {
  const element = useRef<HTMLDivElement>(null)
  const [tileError, setTileError] = useState(false)
  const [tileAttempt, setTileAttempt] = useState(0)
  const [address, setAddress] = useState<BerlinAddress | null>(null)
  useLayoutEffect(() => {
    if (compact) return
    const frame = element.current?.closest<HTMLElement>('.map-container')
    if (!frame) return
    let disposed = false
    let animation = 0
    const navigation = document.querySelector<HTMLElement>('.mobile-nav')
    const fit = () => {
      if (disposed) return
      const top = frame.getBoundingClientRect().top + window.scrollY
      const bottom = navigation?.getBoundingClientRect().height || 80
      const height = `${Math.max(360, Math.floor(window.innerHeight - top - bottom - 8))}px`
      if (frame.style.height !== height) {
        frame.style.height = height
        frame.style.setProperty('--map-height', height)
      }
    }
    const schedule = () => { cancelAnimationFrame(animation); animation = requestAnimationFrame(fit) }
    const observer = new ResizeObserver(schedule)
    if (frame.parentElement) observer.observe(frame.parentElement)
    if (navigation) observer.observe(navigation)
    window.addEventListener('resize', schedule)
    void document.fonts.ready.then(schedule)
    fit()
    return () => {
      disposed = true; observer.disconnect(); cancelAnimationFrame(animation)
      window.removeEventListener('resize', schedule)
    }
  }, [compact])
  const validCafes = useMemo(() => cafes.filter(cafe =>
    Number.isFinite(cafe.lat) && Number.isFinite(cafe.lng) &&
    Math.abs(cafe.lat) <= 90 && Math.abs(cafe.lng) <= 180,
  ), [cafes])

  return <div ref={element} className="cafe-map" role="region" aria-label="Map of Berlin cafes">
    {!compact && <AddressSearch onSelect={setAddress} onClear={() => setAddress(null)} />}
    <div className="map-canvas">
    <MapContainer center={BERLIN} zoom={12} scrollWheelZoom={false} zoomControl={false}
      dragging={!compact} touchZoom={!compact} doubleClickZoom={!compact} keyboard={!compact} boxZoom={!compact}
      style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer key={tileAttempt}
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        eventHandlers={{ tileerror: () => setTileError(true) }} />
      {!compact && <ZoomControl position="bottomright" />}
      <MapViewport cafes={validCafes} selectedId={selectedId} address={address} />
      {address && <Marker position={[address.lat, address.lng]} title={address.label} alt={`Address: ${address.label}`} icon={divIcon({ className: 'address-location-marker', html: '<span aria-hidden="true">⌖</span>', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -32] })}><Popup><strong>{address.label}</strong><br />{address.context}</Popup></Marker>}
      {validCafes.map(cafe => {
        const rating = Number.isFinite(cafe.rating) ? cafe.rating.toFixed(1) : '—'
        const icon = divIcon({
          className: `cafe-marker${cafe.id === selectedId ? ' is-selected' : ''}`,
          html: `<span aria-hidden="true">☕</span><span>${rating}</span>`,
          iconSize: [70, 38], iconAnchor: [35, 38], popupAnchor: [0, -36],
        })
        return <Marker key={cafe.id} position={[cafe.lat, cafe.lng]} icon={icon}
          title={cafe.name} alt={cafe.name} eventHandlers={{ click: () => onSelect(cafe) }}>
          <Popup><strong>{cafe.name}</strong><br />{cafe.district}<br />
            <button type="button" onClick={() => onSelect(cafe)}>View cafe</button>
          </Popup>
        </Marker>
      })}
    </MapContainer>
    {tileError && <div className="map-error" role="status" style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1, padding: '10px 14px', borderRadius: 12, background: '#fff', boxShadow: '0 2px 15px #0002', fontSize: 16 }}>
      Could not load the map. Check your internet connection.{' '}
      <button type="button" onClick={() => { setTileError(false); setTileAttempt(value => value + 1) }} style={{ textDecoration: 'underline' }}>Retry</button>
    </div>}
    </div>
  </div>
}
