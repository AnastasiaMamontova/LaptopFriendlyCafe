import { expect, test, type Page } from '@playwright/test'
import type { Cafe } from '../src/types/cafe'
import { emptyWeek, formatDayHours, parseOpeningHours, serializeOpeningHours, validateWeeklyHours } from '../src/lib/opening-hours'

test('weekly schedules round-trip without changing exact minutes or unspecified days', () => {
  const value = 'Mon–Fri 09:07–18:43\nSat 10:00–16:00\nSun Closed'
  const week = parseOpeningHours(value)!
  expect(week).not.toBeNull()
  expect(week[0].periods[0]).toEqual({ opens: '09:07', closes: '18:43' })
  expect(serializeOpeningHours(week)).toBe(value)
  expect(validateWeeklyHours(week)).toBe('')
  const partial = parseOpeningHours('Tue Open 24 hours')!
  expect(formatDayHours(partial[0])).toBe('Not added')
  expect(formatDayHours(partial[1])).toBe('Open 24 hours')
  expect(serializeOpeningHours(emptyWeek())).toBe('')
})

test('existing grouped schedules, split shifts and overnight hours remain readable', () => {
  const old = parseOpeningHours('Mon–Fri 09:00–18:00, Sat–Sun 10:00–17:00')!
  expect(serializeOpeningHours(old)).toBe('Mon–Fri 09:00–18:00\nSat–Sun 10:00–17:00')
  expect(serializeOpeningHours(parseOpeningHours('Daily 08:00–20:00')!)).toBe('Mon–Sun 08:00–20:00')
  const week = parseOpeningHours('Mon 09:00–12:00, 13:00–18:00\nFri 22:00–02:00 (+1 day)')!
  expect(validateWeeklyHours(week)).toBe('')
  expect(formatDayHours(week[4])).toBe('22:00–02:00 (+1 day)')
})

for (const value of ['09:00–18:00', 'Call ahead on holidays', 'Mon 09:00–18:00; sometimes later', 'Mon 25:00–26:00', 'Mon 09:00–18:00\nMon Closed']) {
  test(`free text is never partially interpreted: ${value}`, () => {
    expect(parseOpeningHours(value)).toBeNull()
  })
}

test('rejects equal times, overlapping shifts, and overlap across the week boundary', () => {
  expect(validateWeeklyHours(parseOpeningHours('Mon 09:00–09:00')!)).toContain('must differ')
  expect(validateWeeklyHours(parseOpeningHours('Tue 09:00–14:00, 13:00–18:00')!)).toContain('overlap')
  expect(validateWeeklyHours(parseOpeningHours('Mon 01:00–09:00\nSun 22:00–02:00 (+1 day)')!)).toContain('overlap')
  expect(validateWeeklyHours(parseOpeningHours('Mon Open 24 hours\nSun 22:00–02:00 (+1 day)')!)).toContain('overlap')
  expect(validateWeeklyHours(parseOpeningHours('Mon 09:00–12:00, 12:00–18:00')!)).toBe('')
  expect(serializeOpeningHours(parseOpeningHours('Mon 13:00–18:00, 09:00–12:00')!)).toBe('Mon 09:00–12:00, 13:00–18:00')
})

async function backend(page: Page, hours = '') {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort('blockedbyclient'))
  let cafes: Cafe[] = [{
    id: '11111111-1111-4111-8111-111111111111', name: 'Schedule Cafe', district: 'Mitte',
    address: 'Teststraße 1', description: 'Test cafe', hours, lat: 52.52, lng: 13.405,
    rating: 4, wifi: true, sockets: true, noise: 'quiet', laptop_friendly: true,
    website: '', photos: [], created_at: '2026-01-01', updated_at: '2026-01-01',
  }]
  const writes: Partial<Cafe>[] = []
  await page.route('https://**.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const respond = (data: unknown) => route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(data) })
    if (request.method() === 'OPTIONS') return route.fulfill({ headers, status: 204 })
    if (url.pathname !== '/rest/v1/cafes') return route.abort('blockedbyclient')
    if (request.method() === 'GET') return respond(url.searchParams.get('select') === 'photos' ? { photos: [] } : cafes)
    if (request.method() !== 'PATCH' && request.method() !== 'POST') return route.abort('blockedbyclient')
    const body = request.postDataJSON()
    writes.push(body)
    const cafe = { ...cafes[0], ...body, id: request.method() === 'POST' ? '22222222-2222-4222-8222-222222222222' : cafes[0].id }
    cafes = request.method() === 'POST' ? [...cafes, cafe] : [cafe]
    return respond(cafe)
  })
  return writes
}

async function edit(page: Page) {
  await page.getByRole('button', { name: 'Open Schedule Cafe', exact: true }).click()
  await page.getByRole('button', { name: 'Edit cafe', exact: true }).click()
}

async function time(page: Page, label: string, value: string) {
  const [hour, minute] = value.split(':')
  await page.getByLabel(`${label} hour`, { exact: true }).selectOption(hour)
  await page.getByLabel(`${label} minute`, { exact: true }).selectOption(minute)
}

test('one weekday time range saves for Monday–Friday and remains editable after reload', async ({ page }) => {
  const writes = await backend(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
  await page.getByLabel('Name', { exact: false }).fill('Weekday Cafe')
  await page.getByLabel('District', { exact: false }).fill('Mitte')
  await page.getByLabel('Address', { exact: false }).fill('Teststraße 2')
  await page.getByLabel('Latitude', { exact: true }).fill('52.51')
  const editor = page.locator('.hours-editor')
  await expect(editor.locator('#hours-hint')).toHaveText('Berlin time')
  await expect(editor.getByText('Monday–Friday', { exact: true })).toBeVisible()
  await expect(editor.getByRole('combobox')).toHaveCount(4)
  await expect(editor.getByRole('button')).toHaveCount(0)
  await expect(editor.getByText(/break|another period|Copy Monday/)).toHaveCount(0)
  await time(page, 'Weekdays opens', '08:00')
  await time(page, 'Weekdays closes', '17:00')
  await page.getByRole('dialog').getByRole('button', { name: 'Add cafe', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open Weekday Cafe', exact: true })).toBeVisible()
  expect(writes[0].hours).toBe('Mon–Fri 08:00–17:00')
  await page.reload()
  await page.getByRole('button', { name: 'Open Weekday Cafe', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Opening hours schedule' })).toHaveText('Mon–Fri 08:00–17:00')
  await page.getByRole('button', { name: 'Edit cafe', exact: true }).click()
  await expect(page.getByLabel('Weekdays opens hour')).toHaveValue('08')
  await expect(page.getByLabel('Weekdays closes hour')).toHaveValue('17')
  await time(page, 'Weekdays closes', '17:43')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[1].hours).toBe('Mon–Fri 08:00–17:43')
})

test('partial and equal times cannot be saved; one overnight interval is supported', async ({ page }) => {
  const writes = await backend(page)
  await page.goto('/')
  await edit(page)
  await time(page, 'Weekdays opens', '08:00')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Choose both opening and closing times.')
  expect(writes).toHaveLength(0)
  await time(page, 'Weekdays closes', '08:00')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Opening and closing times must differ.')
  expect(writes).toHaveLength(0)
  await time(page, 'Weekdays opens', '22:00')
  await time(page, 'Weekdays closes', '02:00')
  await expect(page.getByText('Closes the following morning', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0].hours).toBe('Mon–Fri 22:00–02:00 (+1 day)')
})

for (const original of ['Call ahead on holidays; usually open after lunch.', 'Mon–Fri 09:00–12:00, 13:00–18:00\nSat 10:00–16:00\nSun Closed']) {
  test(`preserves existing hours until a new weekday interval is chosen: ${original}`, async ({ page }) => {
    const writes = await backend(page, original)
    await page.goto('/')
    await edit(page)
    await expect(page.locator('.hours-saved-note blockquote')).toHaveText(original)
    await expect(page.locator('.hours-editor').getByRole('combobox')).toHaveCount(4)
    await page.getByLabel('About this place').fill('Updated description')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(writes[0].hours).toBe(original)
    await edit(page)
    await time(page, 'Weekdays opens', '08:07')
    await time(page, 'Weekdays closes', '17:43')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(writes[1].hours).toBe('Mon–Fri 08:07–17:43')
  })
}

test('blank hours stay unknown and clearing both times removes the saved interval', async ({ page }) => {
  const writes = await backend(page)
  await page.goto('/')
  await edit(page)
  await expect(page.getByLabel('Weekdays opens hour')).toHaveValue('')
  await expect(page.getByLabel('Weekdays closes hour')).toHaveValue('')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0].hours).toBe('')
  await edit(page)
  await time(page, 'Weekdays opens', '08:00')
  await time(page, 'Weekdays closes', '17:00')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await edit(page)
  await page.getByLabel('Weekdays opens hour').selectOption('')
  await page.getByLabel('Weekdays closes hour').selectOption('')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[2].hours).toBe('')
})

// A pre-existing interval must not be silently normalized during unrelated edits.
test('existing weekday minutes and original formatting survive unrelated edits', async ({ page }) => {
  const original = 'Monday-Friday 08:07-17:43'
  const writes = await backend(page, original)
  await page.goto('/')
  await edit(page)
  await expect(page.getByLabel('Weekdays opens minute')).toHaveValue('07')
  await expect(page.getByLabel('Weekdays closes minute')).toHaveValue('43')
  await page.getByLabel('About this place').fill('New notes')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0].hours).toBe(original)
})
