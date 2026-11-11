// Run `npm run build && npm run preview -- --port 4173` before this check.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } } : {}) })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('http://localhost:4173')
  console.log('production loaded')
  await page.locator('.skeleton-grid').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.connection-banner').count(), 0)
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json())
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.icons.length, 3)
  console.log('manifest valid')
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated', null, { timeout: 30000 })
  console.log('service worker active')
  // Activate control with an online navigation before testing a fully offline one.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated', null, { timeout: 30000 })
  console.log('starting offline reload')
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30000 })
  console.log('service worker controls offline page')
  await page.getByText('You are offline. Your saved places are available to browse.').waitFor()
  assert.equal(await page.evaluate(async () => (await fetch('/demo/green-corner.jpg')).ok), true)
  if (await page.getByText('Explore a sample collection').isVisible()) {
    await page.getByText('Explore a sample collection').click()
    await page.getByRole('button', { name: 'Open The Green Corner' }).waitFor()
  } else {
    assert.ok(await page.locator('.cafe-card').count() > 0, 'The cached collection must be available offline')
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  console.log('offline photos valid')
  await context.setOffline(false)
  // Screenshot/demo checks use a fresh browser context with a controlled read-only catalog.
  const screenshotContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  await screenshotContext.route('https://**.supabase.co/rest/v1/cafes*', route => route.fulfill({ contentType: 'application/json', body: '[]', headers: { 'access-control-allow-origin': '*' } }))
  const screenshotPage = await screenshotContext.newPage()
  await screenshotPage.goto('http://localhost:4173')
  await screenshotPage.getByText('Your first cafe awaits').waitFor()
  await mkdir('docs/screenshots', { recursive: true })
  await screenshotPage.evaluate(() => scrollTo(0, 0))
  await screenshotPage.screenshot({ path: 'docs/screenshots/mobile.png', animations: 'disabled' })
  await screenshotPage.getByText('Explore a sample collection').click()
  await screenshotPage.setViewportSize({ width: 1440, height: 1000 })
  await screenshotPage.evaluate(() => scrollTo(0, 0))
  await screenshotPage.screenshot({ path: 'docs/screenshots/desktop-demo.png', animations: 'disabled' })
  await screenshotPage.getByRole('button', { name: 'Map', exact: true }).click()
  await screenshotPage.getByRole('region', { name: 'Map of Berlin cafes' }).waitFor()
  await screenshotPage.waitForFunction(() => Array.from(document.querySelectorAll('.leaflet-tile')).some(img => img instanceof HTMLImageElement && img.naturalWidth > 0))
  assert.equal(await screenshotPage.locator('.cafe-marker').count(), 3)
  assert.deepEqual(errors, [])
  console.log('PASS: production PWA manifest + active service worker + offline reload + local photos + real OSM tiles + responsive layout')
} finally { await browser.close() }
