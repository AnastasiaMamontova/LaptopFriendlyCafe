# Build verification

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
