import { expect, test, type Page } from '@playwright/test'

type AndroidHarness = Window & {
  androidBridge: object
  Capacitor: object
  pressAndroidBack: () => void
  androidBackListeners: () => number
  androidExitCalls: number
}

async function nativeBridge(page: Page) {
  await page.addInitScript(() => {
    const win = window as unknown as AndroidHarness
    const listeners = new Map<string, (data: { canGoBack: boolean }) => void>()
    let next = 0
    win.androidBridge = {}
    win.androidExitCalls = 0
    win.Capacitor = {
      PluginHeaders: [{ name: 'App', methods: [{ name: 'addListener', rtype: 'callback' }, { name: 'removeListener', rtype: 'promise' }, { name: 'exitApp', rtype: 'promise' }] }],
      nativeCallback: (_plugin: string, method: string, options: { eventName: string }, callback: (data: { canGoBack: boolean }) => void) => {
        if (method !== 'addListener' || options.eventName !== 'backButton') throw new Error('Unexpected native callback')
        const id = String(++next); listeners.set(id, callback); return id
      },
      nativePromise: async (_plugin: string, method: string, options: { callbackId?: string } = {}) => {
        if (method === 'removeListener') listeners.delete(options.callbackId!)
        else if (method === 'exitApp') win.androidExitCalls++
        else throw new Error('Unexpected native method')
      },
    }
    win.pressAndroidBack = () => { for (const callback of [...listeners.values()]) callback({ canGoBack: false }) }
    win.androidBackListeners = () => listeners.size
  })
}

async function back(page: Page) { await page.evaluate(() => (window as unknown as AndroidHarness).pressAndroidBack()) }
async function exitCalls(page: Page) { return page.evaluate(() => (window as unknown as AndroidHarness).androidExitCalls) }

async function backend(page: Page) {
  let cafes = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Back Cafe', district: 'Mitte', address: 'Sample street 1, Berlin', description: 'A place for coffee and work.', rating: 4.7, lat: 52.52, lng: 13.405, wifi: true, sockets: true, noise: 'quiet', good_tables: true, hours: 'Mon–Fri 08:00–17:00', website: '', photos: ['/demo/green-corner.jpg', '/demo/sunday-coffee.jpg'], created_at: '2026-01-01', updated_at: '2026-01-01' }]
  const writes: string[] = []
  await page.route('https://**.supabase.co/**', async route => {
    const request = route.request(), url = new URL(request.url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const respond = (data: unknown) => route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(data) })
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname !== '/rest/v1/cafes') return route.abort('blockedbyclient')
    if (request.method() === 'GET') return respond(url.searchParams.get('select') === 'photos' ? { photos: cafes[0]?.photos || [] } : cafes)
    writes.push(request.method())
    if (request.method() === 'PATCH') { cafes = [{ ...cafes[0], ...request.postDataJSON() }]; return respond(cafes[0]) }
    if (request.method() === 'DELETE') { const id = cafes[0].id; cafes = []; return respond([{ id }]) }
    return route.abort('blockedbyclient')
  })
  await page.route('https://tile.openstreetmap.org/**', route => route.abort('blockedbyclient'))
  await page.route('https://photon.komoot.io/**', route => route.fulfill({ contentType: 'application/json', body: '{"type":"FeatureCollection","features":[]}' }))
  return writes
}

test('Android Back closes photos, then the cafe, then the map; exit requires confirmation', async ({ page }) => {
  await nativeBridge(page)
  const writes = await backend(page)
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => (window as unknown as AndroidHarness).androidBackListeners())).toBe(1)
  await page.getByRole('button', { name: 'Open Back Cafe', exact: true }).click()
  await page.getByRole('button', { name: 'Show photo 2', exact: true }).click()
  await back(page)
  await expect(page.locator('.photo-viewer')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Back Cafe', exact: true })).toBeVisible()
  await expect(page.locator('.detail-photo>img')).toHaveAttribute('src', '/demo/sunday-coffee.jpg')
  await back(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Find an address in Berlin' })).toBeVisible()
  await back(page)
  await expect(page.getByRole('combobox', { name: 'Search cafes' })).toBeVisible()
  await back(page)
  const exit = page.getByRole('alertdialog', { name: 'Exit app?', exact: true })
  await expect(exit.getByRole('button', { name: 'Stay', exact: true })).toBeFocused()
  expect(await exitCalls(page)).toBe(0)
  await back(page)
  await expect(exit).toHaveCount(0)
  expect(await exitCalls(page)).toBe(0)
  await back(page)
  await exit.getByRole('button', { name: 'Exit app', exact: true }).click()
  await expect.poll(() => exitCalls(page)).toBe(1)
  expect(writes).toEqual([])
})

test('Android Back dismisses suggestions and filters, cancels deletion and returns from editing to the cafe', async ({ page }) => {
  await nativeBridge(page)
  const writes = await backend(page)
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => (window as unknown as AndroidHarness).androidBackListeners())).toBe(1)
  const search = page.getByRole('combobox', { name: 'Search cafes' })
  await search.fill('Back')
  await expect(page.getByRole('listbox', { name: 'Cafe suggestions' })).toBeVisible()
  await back(page)
  await expect(page.getByRole('listbox', { name: 'Cafe suggestions' })).toHaveCount(0)
  await expect(search).toHaveValue('Back')
  await back(page)
  await expect(search).toHaveValue('')
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.locator('.filter-options button').first().click()
  await back(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Wi-Fi', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Open Back Cafe', exact: true }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await back(page)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Back Cafe', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit cafe details', exact: true }).click()
  await page.getByLabel('Name', { exact: false }).fill('Unsaved name')
  await back(page)
  await expect(page.getByRole('heading', { name: 'Back Cafe', exact: true })).toBeVisible()
  await back(page)
  await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
  await back(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  const address = page.getByRole('combobox', { name: 'Find an address in Berlin' })
  await address.fill('Tor')
  await back(page)
  await expect(address).toHaveAttribute('aria-expanded', 'false')
  await expect(address).toBeVisible()
  await back(page)
  await expect(search).toBeVisible()
  expect(await exitCalls(page)).toBe(0)
  expect(writes).toEqual([])
})

test('Android Back does not interrupt saving or a confirmed deletion', async ({ page }) => {
  await nativeBridge(page)
  const writes = await backend(page)
  const endpoint = 'https://**.supabase.co/rest/v1/cafes**'
  let releaseSave!: () => void, releaseDelete!: () => void
  const save = new Promise<void>(resolve => { releaseSave = resolve })
  const deletion = new Promise<void>(resolve => { releaseDelete = resolve })
  await page.route(endpoint, async route => {
    if (route.request().method() === 'PATCH') await save
    if (route.request().method() === 'DELETE') await deletion
    await route.fallback()
  })
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => (window as unknown as AndroidHarness).androidBackListeners())).toBe(1)
  try {
    await page.getByRole('button', { name: 'Open Back Cafe', exact: true }).click()
    await page.getByRole('button', { name: 'Edit cafe details', exact: true }).click()
    await page.getByLabel('Name', { exact: false }).fill('Saved Cafe')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled()
    await back(page)
    await expect(page.getByRole('heading', { name: 'Edit cafe', exact: true })).toBeVisible()
    releaseSave()
    await expect(page.getByRole('button', { name: 'Open Saved Cafe', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Open Saved Cafe', exact: true }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete cafe', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Deleting…', exact: true })).toBeDisabled()
    await back(page)
    await expect(page.getByRole('alertdialog', { name: 'Delete this cafe?', exact: true })).toBeVisible()
    releaseDelete()
    await expect(page.getByRole('heading', { name: 'Your first cafe awaits', exact: true })).toBeVisible()
    expect(await exitCalls(page)).toBe(0)
    expect(writes).toEqual(['PATCH', 'DELETE'])
  } finally { releaseSave(); releaseDelete() }
})

test('web browser Back is not intercepted by the Android integration', async ({ page }) => {
  await backend(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Open Back Cafe', exact: true })).toBeVisible()
  await page.evaluate(() => history.pushState({}, '', '/?browser-back-check'))
  await page.goBack()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByRole('alertdialog', { name: 'Exit app?', exact: true })).toHaveCount(0)
})
