export interface BerlinAddress {
  id: string
  label: string
  context: string
  lat: number
  lng: number
}

// The box limits the request; administrative properties exclude Brandenburg
// locations that also fall inside Berlin's rectangular bounding box.
export const BERLIN_BOUNDS = { west: 13.088, south: 52.338, east: 13.761, north: 52.675 }
const DEFAULT_ENDPOINT = 'https://photon.komoot.io/api/'
const cache = new Map<string, BerlinAddress[]>()
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

export function parseBerlinAddresses(data: unknown): BerlinAddress[] {
  const collection = object(data)
  if (!Array.isArray(collection?.features)) throw new Error('Invalid address search response.')
  const addresses: BerlinAddress[] = []
  const seen = new Set<string>()
  for (const feature of collection.features) {
    const entry = object(feature)
    const properties = object(entry?.properties)
    const geometry = object(entry?.geometry)
    if (!properties || geometry?.type !== 'Point' || !Array.isArray(geometry.coordinates)) continue
    const [lng, lat] = geometry.coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat < BERLIN_BOUNDS.south || lat > BERLIN_BOUNDS.north || lng < BERLIN_BOUNDS.west || lng > BERLIN_BOUNDS.east) continue
    const city = text(properties.city).toLowerCase()
    const state = text(properties.state).toLowerCase()
    const country = text(properties.countrycode).toLowerCase()
    if ((city !== 'berlin' && state !== 'berlin') || (country && country !== 'de')) continue
    const street = text(properties.street) || ((properties.osm_key === 'highway' || properties.type === 'street') ? text(properties.name) : '')
    if (!street) continue
    const label = [street, text(properties.housenumber)].filter(Boolean).join(' ')
    const postcode = text(properties.postcode)
    const district = text(properties.district) || text(properties.locality)
    const context = [...new Set([district, [postcode, 'Berlin'].filter(Boolean).join(' ')].filter(Boolean))].join(' · ')
    const key = `${label}|${postcode}|${district}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    addresses.push({ id: `${label}:${lat}:${lng}`, label, context, lat, lng })
    if (addresses.length === 6) break
  }
  return addresses
}

export function buildAddressSearchUrl(query: string): URL {
  const url = new URL(import.meta.env?.VITE_ADDRESS_SEARCH_URL?.trim() || DEFAULT_ENDPOINT)
  url.searchParams.set('q', query.trim())
  url.searchParams.set('lang', 'en')
  url.searchParams.set('limit', '12')
  url.searchParams.set('lat', '52.52')
  url.searchParams.set('lon', '13.405')
  url.searchParams.set('bbox', `${BERLIN_BOUNDS.west},${BERLIN_BOUNDS.south},${BERLIN_BOUNDS.east},${BERLIN_BOUNDS.north}`)
  return url
}

export async function searchBerlinAddresses(query: string, signal: AbortSignal): Promise<BerlinAddress[]> {
  if (query.trim().length < 3) return []
  const url = buildAddressSearchUrl(query)
  const key = url.toString().toLowerCase()
  const saved = cache.get(key)
  if (saved) return saved
  const request = new AbortController()
  const abort = () => request.abort()
  if (signal.aborted) request.abort()
  signal.addEventListener('abort', abort, { once: true })
  const timeout = window.setTimeout(abort, 8000)
  try {
    const response = await fetch(url, { signal: request.signal, credentials: 'omit' })
    if (response.status === 429) throw new Error('Address search is busy. Please try again in a moment.')
    if (!response.ok) throw new Error('Address search is temporarily unavailable. Please try again.')
    const addresses = parseBerlinAddresses(await response.json())
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    if (cache.size >= 40) cache.delete(cache.keys().next().value!)
    cache.set(key, addresses)
    return addresses
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof Error && error.message.startsWith('Address search')) throw error
    throw new Error('Address search is temporarily unavailable. Please try again.')
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}
