# Full-screen photo viewer verification

- Tapping the main cafe photo or a thumbnail opens the selected photo in a
  full-viewport dialog. Images fit inside the screen without cropping.
- Multiple photos support next/previous buttons, keyboard arrows and horizontal
  touch swipes, with circular navigation and a photo counter. A single photo
  does not show navigation arrows; cafes without photos have no enlargement button.
- Short, vertical and multi-finger gestures do not change the selected photo.
- Close/Escape dismisses only the viewer. The cafe remains open on the last
  viewed photo, and keyboard focus returns to the image control that opened it.
  Keyboard Tab navigation stays within the viewer while it is open.
- Loading and failed images have English status feedback; a failed photo can be
  retried or skipped. Browsing photos never writes to the backend.
- All 68 Playwright tests passed across mobile and desktop, including actual
  browser touch input, keyboard/focus behavior, one/many/missing/failed photos,
  catalog/map, CRUD, weekday hours and offline cache. Backend requests were mocked.
- TypeScript and the production web/PWA build passed. Production viewing was
  checked at 320, 390 and 1440 px widths without overflow or runtime errors:
  [mobile](screenshots/photo-viewer-mobile.png),
  [desktop](screenshots/photo-viewer-desktop.png). Screenshots use illustrative
  fixture data and local photos; production records were unchanged.
- No APK was built. The versioned Android 1.0.5 APK is unchanged and does not
  include this new viewer until the next requested Android build.

## Android 1.0.5 verification

The current APK includes the agreed catalog, detail, icon and weekday-hours
changes. Static Cafe / Cafes labels now use plain spelling; the collection title
reads “Laptop-friendly cafes”, the hours hint reads “Berlin time”, and catalog
laptop filters/badges and install controls are removed.

All 62 mobile/desktop tests, TypeScript, production web/PWA build, Android build,
Android lint, signature verification and comparison of all 23 bundled web files
pass. The certificate matches Android 1.0.4. The production UI was also checked
at widths of 320, 390 and 1440 px. See
[release verification](ANDROID_RELEASE_1.0.5.md) for details and the checksum.
The APK is excluded from Git. Physical-device testing was not performed.

## Catalog heading, filters and footer verification

- The list heading is now “Laptop-friendly cafes”. The cafe count stays with
  the last word when the heading wraps on mobile.
- Removed the laptop quick filter, its checkbox in the filter dialog, and its
  filtering condition. Catalog cards and map previews no longer repeat laptop
  badges. Existing cafe records and their stored fields remain unchanged.
- Removed the footer install button and its help dialog/prompt flow. No install
  control was relocated. Offline collection browsing and PWA updates remain.
- The three remaining quick filters share one row on mobile.
- All 20 catalog Playwright tests passed on mobile and desktop, covering search,
  remaining filters, map, detail view, CRUD/photos, offline cache and English UI.
  TypeScript and the production Vite/PWA build passed.
- Production screenshots use illustrative fixture data and local photos:
  [top](screenshots/catalog-top-mobile.png) and
  [bottom](screenshots/catalog-bottom-mobile.png). Widths of 320, 390 and 1440 px
  were checked without horizontal overflow or browser runtime errors.
- No APK was built during the initial catalog change. These updates are now
  included in Android 1.0.5; the versioned Android 1.0.4 APK remains unchanged.

## Weekday hours editor verification

- Replaced seven day rows, status selectors, copy controls and additional periods
  with a fixed Weekdays / Monday–Friday card and four hour/minute selectors.
- A single interval saves as `Mon–Fri 08:00–17:00`. Exact minutes, reload/edit,
  empty hours, clearing both times, partial-input validation and overnight closing
  are covered. Existing complex schedules and free text survive unrelated edits.
- All 62 Playwright tests passed across mobile and desktop. TypeScript and the
  production Vite/PWA build passed. Test backend requests were intercepted.
- The production form was checked at widths of 320, 390 and 1440 px without
  horizontal overflow or browser runtime errors. At 320 px the time fields stack.
- [Mobile screenshot](screenshots/opening-hours-mobile.png) and
  [opening-hours field](screenshots/weekday-hours-field.png) use illustrative
  fixture data. No production records were changed.
- No APK was built during the initial editor change. The weekday editor and
  shortened Berlin time hint are now included in Android 1.0.5.

## Android 1.0.4 verification

The current APK includes all interface changes, the approved cappuccino-cat
launcher icon and the redesigned cafe detail page. Production web build, Android
build, Android lint, signature verification and a byte-for-byte comparison of all
23 bundled web files pass. The certificate matches Android 1.0.3.
See [release verification](ANDROID_RELEASE_1.0.4.md) for the checksum and details.
The APK is excluded from Git. Physical-device testing was not performed.

## Cafe detail design verification

- Implemented the approved design with a full-screen mobile detail view, 36 px
  cafe title, 20 px body text and amenity labels, and 24 px section headings.
- Personal rating appears below the district. Four large amenity tiles preserve
  unknown availability and the actual atmosphere; a lively cafe is not labelled quiet.
- Opening hours remain on one line with consecutive identical days grouped.
  Complete schedules, including weekends and overnight periods, scroll horizontally
  and support keyboard focus. Editing and stored hours are unchanged.
- Gallery selection, both edit controls, deletion, directions and website links
  remain functional. Sample cards remain read-only.
- All 56 Playwright tests passed across mobile and desktop, including CRUD, photos,
  hours selectors, address search and offline cache. TypeScript and the production
  web/PWA build passed. Backend requests in automated tests were intercepted.
- Screenshots use illustrative fixture data and local photos, without changing
  production records. Checked widths of 320, 390 and 1440 px with no horizontal
  overflow or browser runtime errors.
- No APK was built during the initial UI change. These changes are now included
  in Android 1.0.4, documented above; the versioned 1.0.3 APK remains unchanged.

Screenshots: [mobile](screenshots/mobile-details.png),
[complete mobile page](screenshots/cafe-details-full.png),
[desktop](screenshots/desktop-details.png),
[320 px screen](screenshots/small-details.png).

## Cappuccino-cat icon verification

- The master PNG is byte-for-byte identical to the selected design: no steam,
  handle on the right, and the original lavender/coral styling.
- Browser favicon, PWA/touch icons, the in-app cafe-card emblem, Android launcher
  icons and splash artwork now use the shared master. Previous icon assets and
  references were removed.
- PNG dimensions were checked for the four browser/PWA outputs and fifteen
  Android launcher/foreground outputs.
- Production web/PWA build and six relevant mobile/desktop interface tests pass.
- Icon generation runs without invoking Gradle or producing an APK. Previously
  built APKs are unchanged; this icon is now packaged in Android 1.0.4.

Regeneration instructions: [BRANDING.md](BRANDING.md).

## Android 1.0.3 verification

The APK includes the current full-width interface with larger text and without
the application header. Production web build, Android build and Android lint
pass. Its signature matches 1.0.2, and all 23 bundled web files match `dist/`.
See [release verification](ANDROID_RELEASE_1.0.3.md) for the checksum and details.
The APK is excluded from Git. Physical-device testing was not performed.

## Full-width layout verification

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
- These layout changes are included in Android 1.0.3, documented above.

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
