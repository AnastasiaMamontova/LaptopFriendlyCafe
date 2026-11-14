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
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
}

async function time(page: Page, label: string, value: string) {
  const [hour, minute] = value.split(':')
  await page.getByLabel(`${label} hour`, { exact: true }).selectOption(hour)
  await page.getByLabel(`${label} minute`, { exact: true }).selectOption(minute)
}

test('creates uniform weekly hours using only lists, then reloads and edits them', async ({ page }) => {
  const writes = await backend(page)
  await page.goto('/')
  await page.locator('.topbar .button').click()
  await page.getByLabel('Name', { exact: false }).fill('Weekly Cafe')
  await page.getByLabel('District', { exact: false }).fill('Mitte')
  await page.getByLabel('Address', { exact: false }).fill('Teststraße 2')
  await page.getByLabel('Latitude', { exact: true }).fill('52.51')
  await page.getByLabel('Monday hours', { exact: true }).selectOption('open')
  await time(page, 'Monday period 1 closes', '18:30')
  await page.getByRole('button', { name: 'Mon–Fri', exact: true }).click()
  await page.getByLabel('Saturday hours', { exact: true }).selectOption('open')
  await time(page, 'Saturday period 1 opens', '10:15')
  await time(page, 'Saturday period 1 closes', '16:00')
  await page.getByLabel('Sunday hours', { exact: true }).selectOption('closed')
  await page.getByRole('dialog').getByRole('button', { name: 'Add cafe', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open Weekly Cafe', exact: true })).toBeVisible()
  expect(writes[0].hours).toBe('Mon–Fri 09:00–18:30\nSat 10:15–16:00\nSun Closed')
  await page.reload()
  await page.getByRole('button', { name: 'Open Weekly Cafe', exact: true }).click()
  const schedule = page.getByRole('dialog').getByLabel('Weekly opening hours')
  await expect(schedule).toContainText('Monday')
  await expect(schedule).toContainText('09:00–18:30')
  await expect(schedule).toContainText('Closed')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Friday period 1 closes minute')).toHaveValue('30')
  await expect(page.getByLabel('Saturday period 1 opens minute')).toHaveValue('15')
  await expect(page.getByLabel('Sunday hours', { exact: true })).toHaveValue('closed')
})

test('blocks overlaps, supports a lunch break, 24 hours and overnight closing', async ({ page }) => {
  const writes = await backend(page)
  await page.goto('/')
  await edit(page)
  await page.getByLabel('Monday hours', { exact: true }).selectOption('open')
  await page.getByRole('button', { name: 'Add a break / another period', exact: true }).click()
  await time(page, 'Monday period 2 opens', '13:00')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('overlap')
  expect(writes).toHaveLength(0)
  await time(page, 'Monday period 1 closes', '12:00')
  await time(page, 'Monday period 2 closes', '18:00')
  await page.getByLabel('Tuesday hours', { exact: true }).selectOption('all-day')
  await page.getByLabel('Wednesday hours', { exact: true }).selectOption('closed')
  await page.getByLabel('Thursday hours', { exact: true }).selectOption('open')
  await time(page, 'Thursday period 1 opens', '22:00')
  await time(page, 'Thursday period 1 closes', '02:00')
  await expect(page.getByText('Closes the next day', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0].hours).toBe('Mon 09:00–12:00, 13:00–18:00\nTue Open 24 hours\nWed Closed\nThu 22:00–02:00 (+1 day)')
})

test('keeps old free text through unrelated edits and only replaces it explicitly', async ({ page }) => {
  const original = 'Call ahead on holidays; usually open after lunch.'
  const writes = await backend(page, original)
  await page.goto('/')
  await edit(page)
  await expect(page.getByText(original, { exact: true })).toBeVisible()
  await page.getByLabel('About this place').fill('Updated description')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0].hours).toBe(original)
  await edit(page)
  await page.getByRole('button', { name: 'Replace with weekly schedule' }).click()
  await page.getByLabel('Monday hours', { exact: true }).selectOption('open')
  await page.getByRole('button', { name: 'Restore previously saved hours' }).click()
  await expect(page.getByText(original, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Replace with weekly schedule' }).click()
  await page.getByLabel('Monday hours', { exact: true }).selectOption('all-day')
  await page.getByRole('button', { name: 'Every day', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[1].hours).toBe('Mon–Sun Open 24 hours')
})
