import { expect, test, type Page } from '@playwright/test'
import type { Cafe } from '../src/types/cafe'

// Deterministic UI contract tests. Every Supabase request is intercepted; these
// tests never add, update, or delete data in the configured live project.
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAIElEQVR4nGMompxJNmIY1Zw5GmCZo4kkczRjZA5cYQAADnE7/4LO2kUAAAAASUVORK5CYII=', 'base64')
const fixture = (id: string, name: string, district: string, rating: number, extras: Partial<Cafe> = {}): Cafe => ({
  id, name, district, rating, address: 'Teststraße 1, Berlin', lat: 52.52, lng: 13.405,
  description: 'A cozy place to work with a laptop.', wifi: true, sockets: true,
  noise: 'quiet', laptop_friendly: true, hours: '09:00–18:00', website: 'https://example.com',
  photos: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', ...extras,
})
const initialCafes = [
  fixture('11111111-1111-4111-8111-111111111111', 'Alpha Coffee', 'Mitte', 4.3),
  fixture('22222222-2222-4222-8222-222222222222', 'Bravo Café', 'Kreuzberg', 4.9, { lat: 52.49, lng: 13.42, wifi: false, noise: 'lively', created_at: '2026-01-03T00:00:00Z' }),
  fixture('33333333-3333-4333-8333-333333333333', 'Charlie Espresso', 'Mitte', 3.5, { lat: 52.54, lng: 13.4, sockets: false, noise: 'moderate', created_at: '2026-01-02T00:00:00Z' }),
]

async function mockBackend(page: Page, input = initialCafes) {
  let cafes = structuredClone(input)
  const writes: { method: string; body: Record<string, unknown> }[] = []
  let uploads = 0
  let photoDeletes = 0
  await page.route('https://**.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const respond = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname === '/rest/v1/cafes') {
      const id = url.searchParams.get('id')?.replace('eq.', '')
      if (method === 'GET') {
        const result = id ? cafes.find(c => c.id === id) : cafes
        if (url.searchParams.get('select') === 'photos') return respond({ photos: (result as Cafe)?.photos || [] })
        return respond(result)
      }
      const body = method === 'DELETE' ? {} : request.postDataJSON()
      writes.push({ method, body })
      if (method === 'POST') {
        const cafe = { ...fixture('44444444-4444-4444-8444-444444444444', '', '', 4), ...body }
        cafes.push(cafe)
        return respond(cafe, 201)
      }
      if (method === 'PATCH') {
        cafes = cafes.map(c => c.id === id ? { ...c, ...body } : c)
        return respond(cafes.find(c => c.id === id))
      }
      if (method === 'DELETE') { cafes = cafes.filter(c => c.id !== id); return respond([{ id }]) }
    }
    if (url.pathname.startsWith('/storage/v1/object/')) {
      if (method === 'POST') { uploads++; return respond({ Key: 'cafe-photos/test.jpg' }) }
      if (method === 'DELETE') { photoDeletes++; return respond([]) }
      return route.fulfill({ contentType: 'image/png', body: image, headers })
    }
    // Guard against accidental live requests if application endpoints change.
    return route.abort('blockedbyclient')
  })
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: image }))
  await page.route('https://nominatim.openstreetmap.org/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ lat: '52.52', lon: '13.405' }]) }))
  return { get cafes() { return cafes }, writes, get uploads() { return uploads }, get photoDeletes() { return photoDeletes } }
}

async function open(page: Page) {
  await page.goto('/')
  await expect(page.locator('.cafe-card')).toHaveCount(3)
}
async function setRange(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((el, val) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

test('cafe details preserve amenities, complete hours, gallery and editing in the large-text layout', async ({ page }) => {
  const photos = ['one', 'two'].map(name => `https://ui-test.supabase.co/storage/v1/object/public/cafe-photos/${name}.jpg`)
  await mockBackend(page, [fixture(initialCafes[0].id, 'Detail Cafe', 'Mitte', 4.7, {
    wifi: false, laptop_friendly: false, noise: 'lively', photos,
    hours: 'Mon–Fri 09:00–18:00\nSat 10:00–16:00\nSun Closed',
  })])
  await page.goto('/')
  await page.getByRole('button', { name: 'Open Detail Cafe', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const amenities = dialog.getByRole('list', { name: 'Work essentials' })
  await expect(amenities.getByRole('listitem')).toHaveCount(4)
  await expect(amenities.getByText('No / not confirmed', { exact: true })).toHaveCount(2)
  await expect(amenities).toContainText('Lively')
  await expect(amenities.getByText('Quiet', { exact: true })).toHaveCount(0)
  await expect(dialog.locator('.detail-rating')).toHaveText('4.7Your rating')
  await expect(dialog.getByRole('heading', { name: 'About this café' })).toBeVisible()
  await expect(dialog.locator('.detail-description')).toHaveCSS('font-size', '20px')
  const hours = dialog.getByRole('region', { name: 'Opening hours schedule' })
  await expect(hours).toHaveText('Mon–Fri 09:00–18:00 · Sat 10:00–16:00 · Sun Closed')
  await expect(hours).toHaveCSS('white-space', 'nowrap')
  await hours.focus()
  await page.keyboard.press('End')
  await expect(dialog.getByRole('link', { name: 'Visit website' })).toHaveAttribute('href', 'https://example.com')
  await expect(dialog.getByRole('link', { name: 'Get directions' })).toHaveAttribute('href', /destination=52.52,13.405/)
  await dialog.getByRole('button', { name: 'Show photo 2', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Show photo 2', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.locator('.detail-hero>img')).toHaveAttribute('src', photos[1])
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await dialog.getByRole('button', { name: 'Edit cafe details', exact: true }).click()
  await expect(page.getByLabel('Name', { exact: false })).toHaveValue('Detail Cafe')
  await expect(page.getByLabel('Sunday hours', { exact: true })).toHaveValue('closed')
  await expect(page.getByRole('button', { name: /Remove photo/ })).toHaveCount(2)
})

for (const mode of ['search, filters and sorting', 'map and card', 'create edit delete and photos', 'offline cache'] as const) {
  test(mode, async ({ page }, testInfo) => {
    const backend = await mockBackend(page)
    const runtimeErrors: string[] = []
    page.on('pageerror', error => runtimeErrors.push(error.message))
    await open(page)
    if (mode === 'search, filters and sorting') {
      await expect(page.locator('.card-title h3').first()).toHaveText('Bravo Café')
      await page.getByLabel('Sort by').selectOption('name')
      await expect(page.locator('.card-title h3').first()).toHaveText('Alpha Coffee')
      await page.getByLabel('Search cafes').fill('  alpha  ')
      await expect(page.locator('.cafe-card')).toHaveCount(1)
      await page.getByLabel('Search cafes').fill('mitte')
      await expect(page.locator('.cafe-card')).toHaveCount(2)
      await page.getByLabel('Clear search').click()
      await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
      await expect(page.locator('.cafe-card')).toHaveCount(2)
      await page.getByRole('button', { name: 'Outlets', exact: true }).click()
      await expect(page.locator('.cafe-card')).toHaveCount(1)
      await page.locator('.filters-button').click()
      await page.getByLabel('District', { exact: true }).selectOption('Kreuzberg')
      await page.getByRole('button', { name: 'Show 0 places' }).click()
      await expect(page.getByText('No matches just yet')).toBeVisible()
      await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
      await expect(page.locator('.cafe-card')).toHaveCount(3)
      await page.locator('.filters-button').click()
      await setRange(page, '#filter-rating', '4.5')
      await page.getByRole('button', { name: 'Show 1 place' }).click()
      await expect(page.locator('.card-title h3')).toHaveText(['Bravo Café'])
      await page.getByRole('button', { name: 'Clear all' }).click()
      await expect(page.locator('.cafe-card')).toHaveCount(3)
      const width = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: window.innerWidth }))
      expect(width.body).toBeLessThanOrEqual(width.viewport)
      await page.screenshot({ path: `test-results/catalog-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' })
    } else if (mode === 'map and card') {
      await page.getByRole('button', { name: 'Map', exact: true }).first().click()
      await expect(page.getByRole('region', { name: 'Map of Berlin cafes' })).toBeVisible()
      await expect(page.locator('.cafe-marker')).toHaveCount(3)
      await page.locator('.cafe-marker[title="Alpha Coffee"]').click()
      const detail = page.getByRole('dialog')
      await expect(detail.getByRole('heading', { name: 'Alpha Coffee', exact: true })).toBeVisible()
      await expect(detail.getByRole('button', { name: 'Edit café', exact: true })).toBeVisible()
      await expect(detail.getByRole('link', { name: /Get directions/ })).toHaveAttribute('href', /destination=52.52,13.405/)
      await expect(detail.getByRole('button', { name: /Sign in|Sign up/ })).toHaveCount(0)
      await page.screenshot({ path: `test-results/detail-${testInfo.project.name}.png`, animations: 'disabled' })
      await detail.getByLabel('Close', { exact: true }).click()
    } else if (mode === 'create edit delete and photos') {
      await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
      const editor = page.getByRole('dialog')
      await editor.getByLabel('Name', { exact: false }).fill('Delta Work Cafe')
      await editor.getByLabel('District', { exact: false }).fill('Wedding')
      await editor.getByLabel('Address', { exact: false }).fill('Teststraße 2')
      await editor.getByRole('button', { name: 'Find coordinates by address' }).click()
      await expect(editor.getByText('Address found. Coordinates updated.')).toBeVisible()
      await editor.getByLabel('About this place').fill('A new favorite spot')
      await setRange(page, '#cafe-rating', '4.3')
      await editor.getByLabel('Wi-Fi', { exact: true }).check()
      await editor.getByLabel('Upload photos').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: image })
      await expect(editor.getByAltText('New photo 1')).toBeVisible()
      await editor.getByRole('button', { name: 'Add cafe', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Open Delta Work Cafe', exact: true })).toBeVisible()
      expect(backend.uploads).toBe(1)
      const create = backend.writes.find(w => w.method === 'POST')!
      expect(create.body.rating).toBe(4.3)
      expect(create.body.photos).toHaveLength(1)
      await page.getByRole('button', { name: 'Open Delta Work Cafe', exact: true }).click()
      await page.getByRole('button', { name: 'Edit café', exact: true }).click()
      await page.getByLabel('Name', { exact: false }).fill('Delta Updated')
      await page.getByRole('button', { name: 'Remove photo 1' }).click()
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page.getByRole('button', { name: 'Open Delta Updated', exact: true })).toBeVisible()
      expect(backend.writes.find(w => w.method === 'PATCH')?.body.photos).toEqual([])
      expect(backend.photoDeletes).toBeGreaterThan(0)
      await page.getByRole('button', { name: 'Open Delta Updated', exact: true }).click()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await page.getByRole('button', { name: 'Keep cafe', exact: true }).click()
      expect(backend.cafes).toHaveLength(4)
      await page.getByRole('button', { name: 'Open Delta Updated', exact: true }).click()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()
      await page.getByRole('button', { name: 'Delete cafe', exact: true }).click()
      await expect(page.locator('.cafe-card')).toHaveCount(3)
      expect(backend.cafes).toHaveLength(3)
    } else {
      await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('cafe-berlin-catalog-v1')))).toBe(true)
      await page.unroute('https://**.supabase.co/**')
      await page.route('https://**.supabase.co/**', route => route.abort('internetdisconnected'))
      await page.reload()
      await expect(page.locator('.cafe-card')).toHaveCount(3, { timeout: 15_000 })
      await expect(page.getByText('Showing your saved collection.', { exact: false })).toBeVisible({ timeout: 15_000 })
      await page.getByLabel('Search cafes').fill('Mitte')
      await expect(page.locator('.cafe-card')).toHaveCount(2)
    }
    expect(runtimeErrors).toEqual([])
  })
}

test('empty catalog and explicit demo do not write to backend', async ({ page }) => {
  const backend = await mockBackend(page, [])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your first cafe awaits' })).toBeVisible()
  await page.getByRole('button', { name: 'Explore a sample collection' }).click()
  await expect(page.locator('.cafe-card')).toHaveCount(3)
  await expect(page.locator('.demo-banner')).toContainText('Demo')
  await page.locator('.cafe-card').first().click()
  await expect(page.getByRole('dialog')).toContainText('Names and details are illustrative')
  await expect(page.getByRole('button', { name: 'Edit café', exact: true })).toHaveCount(0)
  expect(backend.writes).toEqual([])
})

test('manual coordinates stay open while entering both values', async ({ page }) => {
  const backend = await mockBackend(page)
  await open(page)
  await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
  const editor = page.getByRole('dialog')
  await editor.getByLabel('Name', { exact: false }).fill('Manual Coordinates Cafe')
  await editor.getByLabel('District', { exact: false }).fill('Kreuzberg')
  await editor.getByLabel('Address', { exact: false }).fill('Teststraße 5')
  const lat = editor.getByLabel('Latitude', { exact: true })
  const lng = editor.getByLabel('Longitude', { exact: true })
  await expect(lat).toBeVisible()
  await lat.fill('52.491')
  // Regression: confirming latitude must not collapse the coordinate section.
  await expect(lng).toBeVisible()
  await lng.fill('13.425')
  await expect(lat).toBeVisible()
  await expect(lat).toHaveValue('52.491')
  await expect(lng).toHaveValue('13.425')
  await editor.getByRole('button', { name: 'Add cafe', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open Manual Coordinates Cafe', exact: true })).toBeVisible()
  const create = backend.writes.find(w => w.method === 'POST')!
  expect(create.body.lat).toBe(52.491)
  expect(create.body.lng).toBe(13.425)
})

test('cached catalog is usable while a background refresh is pending', async ({ page }) => {
  await page.addInitScript(cafes => localStorage.setItem('cafe-berlin-catalog-v1', JSON.stringify(cafes)), initialCafes)
  let releaseRefresh!: () => void
  const pendingRefresh = new Promise<void>(resolve => { releaseRefresh = resolve })
  const updated = [...initialCafes, fixture('55555555-5555-4555-8555-555555555555', 'Fresh Cafe', 'Wedding', 4.1)]
  await page.route('https://**.supabase.co/**', async route => {
    await pendingRefresh
    if (route.request().method() === 'GET' && new URL(route.request().url()).pathname === '/rest/v1/cafes') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(updated) })
    }
    return route.abort('blockedbyclient')
  })
  try {
    await page.goto('/')
    await expect(page.locator('.cafe-card')).toHaveCount(3, { timeout: 1500 })
    await expect(page.getByLabel('Loading cafes')).toHaveCount(0)
    await page.getByLabel('Search cafes').fill('Mitte')
    await expect(page.locator('.cafe-card')).toHaveCount(2)
    await page.getByLabel('Clear search').click()
  } finally { releaseRefresh() }
  await expect(page.locator('.cafe-card')).toHaveCount(4)
})

test('offline startup uses cache without waiting for any API request', async ({ page }) => {
  await page.addInitScript(cafes => {
    localStorage.setItem('cafe-berlin-catalog-v1', JSON.stringify(cafes))
    Object.defineProperty(navigator, 'onLine', { get: () => false })
  }, initialCafes)
  let apiRequests = 0
  await page.route('https://**.supabase.co/**', route => { apiRequests++; return route.abort('internetdisconnected') })
  await page.goto('/')
  await expect(page.locator('.cafe-card')).toHaveCount(3, { timeout: 1500 })
  await expect(page.getByText('You are offline.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add cafe', exact: true })).toBeDisabled()
  await page.getByLabel('Search cafes').fill('Mitte')
  await expect(page.locator('.cafe-card')).toHaveCount(2)
  expect(apiRequests).toBe(0)
})

test('English interface, accessible labels and decimal ratings', async ({ page }) => {
  await mockBackend(page)
  await open(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle('Café Berlin — coffee and places to work')
  await expect(page.locator('.rating-badge').first()).toContainText('4.9')
  await expect(page.locator('body')).not.toContainText(/[\u0400-\u04ff]/)
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toContainText(/[\u0400-\u04ff]/)
  await page.getByRole('button', { name: 'Show 3 places', exact: true }).click()
  await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
  const editor = page.getByRole('dialog')
  await expect(editor).not.toContainText(/[\u0400-\u04ff]/)
  await expect(editor.getByLabel('Your rating', { exact: true })).toHaveValue('4')
  await expect(editor.locator('output')).toContainText('4.0')
})
