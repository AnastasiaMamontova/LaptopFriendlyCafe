import { expect, test, type Page } from '@playwright/test'
import { BERLIN_BOUNDS, buildAddressSearchUrl, parseBerlinAddresses } from '../src/lib/address-search'

const feature = (number = '1', extras: Record<string, unknown> = {}, coordinates: unknown[] = [13.42, 52.53]) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates },
  properties: { street: 'Torstraße', housenumber: number, city: 'Berlin', district: 'Mitte', postcode: '10119', countrycode: 'DE', ...extras },
})
const collection = (...features: unknown[]) => ({ type: 'FeatureCollection', features })

test('address results exclude neighboring cities, invalid coordinates and duplicate addresses', () => {
  const results = parseBerlinAddresses(collection(
    feature(), feature(), feature('2'),
    feature('3', { city: 'Bernau bei Berlin', state: 'Brandenburg' }),
    feature('4', {}, [13.9, 52.53]), feature('5', {}, ['13.42', 52.53]),
    feature('6', { countrycode: 'AT' }),
    { geometry: { type: 'Point', coordinates: [13.42, 52.53] }, properties: { name: 'Some place', city: 'Berlin' } },
  ))
  expect(results.map(result => result.label)).toEqual(['Torstraße 1', 'Torstraße 2'])
  expect(results[0]).toMatchObject({ lat: 52.53, lng: 13.42, context: 'Mitte · 10119 Berlin' })
  expect(() => parseBerlinAddresses({ error: 'Not a feature collection' })).toThrow()
})

test('street results and Berlin state are accepted, and suggestions are bounded', () => {
  const street = { geometry: { type: 'Point', coordinates: [13.4, 52.5] }, properties: { name: 'Oranienstraße', type: 'street', state: 'Berlin' } }
  expect(parseBerlinAddresses(collection(street))[0].label).toBe('Oranienstraße')
  expect(parseBerlinAddresses(collection(...Array.from({ length: 12 }, (_, index) => feature(String(index)))))).toHaveLength(6)
})

test('search requests are encoded and restricted to the Berlin bounding box', () => {
  const url = buildAddressSearchUrl('  Straße & 12  ')
  expect(url.hostname).toBe('photon.komoot.io')
  expect(url.searchParams.get('q')).toBe('Straße & 12')
  expect(url.searchParams.get('bbox')).toBe(`${BERLIN_BOUNDS.west},${BERLIN_BOUNDS.south},${BERLIN_BOUNDS.east},${BERLIN_BOUNDS.north}`)
  expect(url.searchParams.get('lang')).toBe('en')
  expect(url.searchParams.has('key')).toBe(false)
})

const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAIElEQVR4nGMompxJNmIY1Zw5GmCZo4kkczRjZA5cYQAADnE7/4LO2kUAAAAASUVORK5CYII=', 'base64')
async function map(page: Page) {
  let writes = 0
  await page.route('https://**.supabase.co/**', route => {
    if (route.request().method() !== 'GET') { writes++; return route.abort('blockedbyclient') }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify([{
      id: '11111111-1111-4111-8111-111111111111', name: 'Existing Cafe', district: 'Mitte', address: 'Teststraße 1',
      lat: 52.52, lng: 13.405, description: '', rating: 4, wifi: true, sockets: true, noise: 'quiet', good_tables: true,
      hours: '', website: '', photos: [], created_at: '2026-01-01', updated_at: '2026-01-01',
    }]) })
  })
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: tile }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Map', exact: true }).first().click()
  await expect(page.locator('.cafe-marker')).toHaveCount(1)
  return { input: page.getByRole('combobox', { name: 'Find an address in Berlin' }), get writes() { return writes } }
}

test('debounced dropdown selects an address with mouse or keyboard without changing cafe data', async ({ page }) => {
  const queries: string[] = []
  await page.route('https://photon.komoot.io/api/**', route => {
    queries.push(new URL(route.request().url()).searchParams.get('q')!)
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(collection(feature(), feature('2'), feature('3', { city: 'Potsdam', state: 'Brandenburg' }))) })
  })
  const app = await map(page)
  await app.input.fill('To')
  await page.waitForTimeout(550)
  expect(queries).toEqual([])
  await app.input.fill('Tors')
  await app.input.fill('Torstr')
  const list = page.getByRole('listbox', { name: 'Berlin address suggestions' })
  await expect(list.getByRole('option')).toHaveCount(2)
  expect(queries).toEqual(['Torstr'])
  await list.getByRole('option').first().click()
  await expect(page.locator('.address-location-marker')).toBeVisible()
  await expect(page.locator('.address-location-marker')).toHaveAttribute('title', 'Torstraße 1')
  await expect(app.input).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.cafe-marker')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear address search' }).click()
  await expect(page.locator('.address-location-marker')).toHaveCount(0)
  await app.input.fill('Torstr')
  await expect(list.getByRole('option')).toHaveCount(2)
  expect(queries).toEqual(['Torstr']) // Same query is served from session memory.
  await app.input.press('ArrowDown')
  await app.input.press('ArrowDown')
  await app.input.press('Enter')
  await expect(page.locator('.address-location-marker')).toHaveAttribute('title', 'Torstraße 2')
  expect(app.writes).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('late results cannot replace a newer address query', async ({ page }) => {
  let started!: () => void
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  const oldStarted = new Promise<void>(resolve => { started = resolve })
  await page.route('https://photon.komoot.io/api/**', async route => {
    const query = new URL(route.request().url()).searchParams.get('q')
    if (query === 'older') { started(); await pending }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(collection(feature(query === 'older' ? '1' : '2'))) }).catch(() => {})
  })
  const app = await map(page)
  await app.input.fill('older')
  await oldStarted
  await app.input.fill('newer')
  const options = page.getByRole('listbox').getByRole('option')
  await expect(options).toHaveCount(1)
  await expect(options.first()).toContainText('Torstraße 2')
  release()
  await page.waitForTimeout(100)
  await expect(options.first()).toContainText('Torstraße 2')
  await app.input.press('Escape')
  await expect(app.input).toHaveAttribute('aria-expanded', 'false')
})

test('failed search can retry and out-of-city results show an empty state', async ({ page }) => {
  let attempts = 0
  await page.route('https://photon.komoot.io/api/**', route => {
    attempts++
    return attempts === 1
      ? route.fulfill({ status: 429, body: 'Busy' })
      : route.fulfill({ contentType: 'application/json', body: JSON.stringify(collection(feature('1', { city: 'Potsdam', state: 'Brandenburg' }))) })
  })
  const app = await map(page)
  await app.input.fill('Torstraße')
  await expect(page.getByText('Address search is busy.', { exact: false })).toBeVisible()
  await page.locator('.address-feedback').getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('No matching Berlin addresses.', { exact: false })).toBeVisible()
  expect(attempts).toBe(2)
  expect(app.writes).toBe(0)
})

test('offline search makes no provider requests and keeps saved cafe markers', async ({ page, context }) => {
  let requests = 0
  await page.route('https://photon.komoot.io/api/**', route => { requests++; return route.abort() })
  const app = await map(page)
  await context.setOffline(true)
  await app.input.fill('Torstraße')
  await expect(page.getByText('Address search needs an internet connection.')).toBeVisible()
  await page.waitForTimeout(550)
  expect(requests).toBe(0)
  await expect(page.locator('.cafe-marker')).toHaveCount(1)
})
