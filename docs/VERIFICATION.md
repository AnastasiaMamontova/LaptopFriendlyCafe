# Full-width layout verification

- Removed the top application header and welcome illustration. The main heading,
  catalog and map now start directly at the top of the content area.
- Removed the desktop width cap. The map runs edge to edge and adjusts its height
  to the available viewport above the bottom navigation, with safe-area padding.
- Increased typography throughout cards, search, filters, dialogs and weekly
  hours. Main content uses 16–18 px text, with larger headings and readable
  secondary labels. Font sizes use rem units.
- Bottom navigation and the single add-cafe button remain available on mobile
  and desktop. App installation is available from the collection footer.
- Mobile quick filters use two columns so the larger labels remain legible.
- The 54-test suite and production web build pass. Layout, map attribution,
  navigation and editor overflow were checked at 320, 390, 600, 768, 1440 and
  1920 px; no horizontal overflow or browser runtime errors were observed.
- No APK was built for these layout changes. The 1.0.2 download documented below
  is the previously built version.

Current catalog screenshots: [mobile](screenshots/mobile.png) and
[desktop](screenshots/desktop-demo.png). They use the local sample collection.

## Android 1.0.2 verification — 2026-11-14

All current feature commits were confirmed on GitHub before building.
The 54-test suite, production web build, Android build and Android lint pass.
The new APK uses versionCode 3 and the same signing certificate as 1.0.1;
its 23 bundled web files match the final production build exactly.
See [the release verification](ANDROID_RELEASE_1.0.2.md) for checksums and details.
The APK stays outside Git. Physical-device testing has not been performed.

## Berlin address search verification — 2026-11-14

- TypeScript and production Vite/PWA build pass.
- Playwright: **54/54 passing**, including all 40 existing checks and 14 new
  address parsing/request and browser checks across mobile and desktop.
- Verified debouncing, short-query suppression, cancellation of stale results,
  memory caching, mouse/keyboard selection, clearing and map positioning,
  rejection of neighboring-city addresses, retry, empty results and offline mode.
- Layout checked at 320, 390, 768 and 1440 px without horizontal overflow.
- A public Photon response and browser/Capacitor-origin CORS headers were checked
  through the trusted HTTPS client. Browser tests intercept provider and tile
  requests. No production cafe records or photos were changed.
- The existing Leaflet/OpenStreetMap map remains in use. No billing, new API
  keys, database migration, APK build or deployment was introduced.

Service usage and configuration: [ADDRESS_SEARCH.md](ADDRESS_SEARCH.md).

## Opening-hours editor verification — 2026-11-14

- TypeScript and the production Vite/PWA build pass.
- Playwright: **40/40 passing** across mobile and desktop projects, including all
  18 catalog checks and 22 new schedule checks (parser/validation and browser
  scenarios run in both projects).
- Verified creation from selectors, standardized storage, reload and re-edit,
  day copying, breaks, 24-hour operation and overnight closing.
- Overlapping periods, equal times and overlaps across Sunday–Monday are rejected.
- Unrecognized legacy text survives unrelated edits and requires explicit
  replacement; restoring the original before saving is covered.
- Tests intercept the API. No live records, photos or policies were changed.
- Layout checked at 320, 390, 768 and 1440 px with no horizontal overflow.
- No schema migration was needed. No APK was built and no deployment was made.

Design rationale and external references: [OPENING_HOURS.md](OPENING_HOURS.md).
Editor screenshot: [opening-hours-mobile.png](screenshots/opening-hours-mobile.png).

## UI refresh verification — 2026-11-14

- English interface refreshed with warm ivory, lavender and coral colors,
  local vector illustrations, cafe cards, map previews and updated dialogs.
- TypeScript and the production Vite/PWA build pass.
- All 18 existing Playwright tests pass against an intercepted test API;
  no live cafe records or photos were changed during this refresh.
- Layout checked at widths 320, 390, 768 and 1440 px without horizontal overflow.
  The welcome search button focuses the catalog search field.
- Map markers and clickable cafe previews pass with intercepted tiles. A live
  OpenStreetMap tile download returns HTTP 200 through the environment's trusted
  HTTPS client, but isolated headless Chromium rejects the environment proxy CA
  (`ERR_CERT_AUTHORITY_INVALID`). Live tiles were not verified in that browser;
  certificate validation was kept enabled.
- Production service worker and offline reload checked with a local fixture
  collection: all three photos, the illustrations and the three local font files
  remain available offline. PWA manifest theme matches the new interface.
- Nunito Sans is self-hosted under the license in `public/fonts/OFL.txt`.
- No Android APK was built for this refresh. No site or environment was published.

Screenshots below use the explicit sample collection, not production records.

## Original application verification (before the UI refresh)

- TypeScript and the production Vite/PWA build pass.
- Playwright: **18/18 passing**, covering mobile 390×844 and desktop 1440×1000 layouts.
- Coverage includes search, combined filters, sorting, map markers, cafe details,
  creating/editing/deleting cafes, photos, fractional ratings, manual coordinates,
  immediate cache rendering and offline startup without API requests.
- Live Supabase check: creation with photo compression/upload, persistence after
  reloading, editing and deletion pass. Temporary records and photos are removed.
- Production PWA check: manifest, service worker activation, offline reload,
  locally cached demo photos and real OpenStreetMap tiles pass.
- Android: `assembleDebug` and `lintDebug` pass. The APK signature is verified.
  Bundled web assets are compared byte-for-byte with the final web build.
- The Supabase management token is absent from source code and the APK.

The interface, validation messages, accessibility labels, demo content, metadata,
ratings and documentation use English. Ratings use a decimal point, such as 4.3.
Current screenshots are in [screenshots/](screenshots/).

APK version: **1.0.1** (versionCode 2), signed with the same development key as the previous build.

APK: `downloads/cafe-berlin-debug.apk`, application ID `app.cafeberlin.mobile`,
Android 6.0+ (minSdk23), targetSdk35. Local builds generate the checksum in
`downloads/SHA256SUMS`; APKs and checksums are excluded from Git.
Installation and behavior on a physical phone have not been tested: this
environment has no Android emulator or connected device.

`npm test` uses a mocked API. Separate `scripts/live-smoke.mjs` and
`scripts/pwa-smoke.mjs` scenarios verify real connections.
The Cloudflare website and development environment have not been published.
