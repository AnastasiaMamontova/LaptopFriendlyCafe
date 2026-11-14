// Opt-in end-to-end check against the configured LIVE Supabase project.
// Starts from a running Vite dev server; creates and deletes one disposable cafe/photo.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox'],
  ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } } : {}),
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const name = `QA temporary ${Date.now()}`
let createdId
try {
  await page.goto(process.env.CAFE_TEST_URL || 'http://localhost:5173')
  await page.locator('.collection-heading h1').waitFor()
  await page.locator('.skeleton-grid').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.connection-banner').count(), 0, 'Real backend must be reachable')
  await page.getByRole('button', { name: 'Add cafe', exact: true }).click()
  const form = page.getByRole('dialog')
  await form.getByLabel('Name', { exact: false }).fill(name)
  await form.getByLabel('District', { exact: false }).fill('Mitte')
  await form.getByLabel('Address', { exact: false }).fill('Torstraße 1, Berlin')
  await form.getByLabel('Latitude').fill('52.527')
  await form.getByLabel('Longitude').fill('13.405')
  await form.getByLabel('About this place').fill('Disposable end-to-end verification. This record is removed automatically.')
  await form.getByLabel('Upload photos').setInputFiles('public/icons/icon-192.png')
  await form.getByRole('checkbox', { name: 'Wi-Fi', exact: true }).check()
  await form.getByRole('checkbox', { name: 'Outlets', exact: true }).check()
  const slider = form.getByRole('slider', { name: 'Your rating' })
  await slider.focus()
  for (let i = 0; i < 3; i++) await slider.press('ArrowRight')
  const creation = page.waitForResponse(r => r.url().includes('/rest/v1/cafes') && r.request().method() === 'POST')
  await form.getByRole('button', { name: 'Add cafe', exact: true }).click()
  const response = await creation
  assert.equal(response.status(), 201)
  const result = await response.json()
  const created = Array.isArray(result) ? result[0] : result
  createdId = created.id
  assert.equal(created.rating, 4.3)
  assert.equal(created.photos.length, 1)
  await page.getByRole('button', { name: `Open ${name}` }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: `Open ${name}` }).click()
  const detail = page.getByRole('dialog')
  const image = detail.locator('.detail-hero > img')
  await image.waitFor()
  await page.waitForFunction(() => { const img = document.querySelector('.detail-hero > img'); return img instanceof HTMLImageElement && img.naturalWidth > 0 })
  await detail.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('About this place').fill('Edited and persisted successfully.')
  const edit = page.waitForResponse(r => r.url().includes('/rest/v1/cafes') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Save changes' }).click()
  assert.equal((await edit).status(), 200)
  await page.getByRole('button', { name: `Open ${name}` }).click()
  await page.getByRole('dialog').getByText('Edited and persisted successfully.').waitFor()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const deletion = page.waitForResponse(r => r.url().includes('/rest/v1/cafes') && r.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Delete cafe', exact: true }).click()
  assert.equal((await deletion).status(), 200)
  await page.getByRole('button', { name: `Open ${name}` }).waitFor({ state: 'detached' })
  // Give storage cleanup (part of the delete promise) time to finish before closing Chromium.
  await page.getByText('Cafe deleted', { exact: true }).waitFor()
  createdId = undefined
  console.log('PASS: live mobile create + compressed photo upload + persisted reload + edit + delete')
} finally {
  if (createdId) {
    await page.evaluate(async id => {
      const { deleteCafe } = await import('/src/lib/cafes.ts')
      await deleteCafe(id)
    }, createdId).catch(() => console.error('Cleanup failed for disposable cafe:', createdId))
  }
  await browser.close()
}
