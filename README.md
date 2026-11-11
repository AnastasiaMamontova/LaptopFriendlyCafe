# Café Berlin

A mobile-first collection of laptop-friendly cafes in Berlin: list and map views,
search by name, district or address, filters for Wi-Fi, outlets, quiet spaces,
laptop use, district and rating, photos, and personal ratings from 1 to 5 in 0.1
increments. Add and edit cafes directly from your phone.

The app has no sign-in or roles. Browsing, adding, editing and deleting are open
to everyone, as agreed for this version. The entire interface is in English.

## Local development

Requires Node.js 22+ and npm.

```sh
npm ci
# Copy .env.example to .env.local and enter the public Supabase settings,
# or run npm run setup:backend with the configured environment variables.
npm run dev
```

Open http://localhost:5173. `npm run build` produces `dist/`;
`npm run preview` serves the production build locally.

Cafe records are stored in Supabase PostgreSQL and photos in Supabase Storage.
See [supabase/README.md](supabase/README.md) for setup and field descriptions.
The Supabase management token stays in the development environment. Only the
project URL and public anon key are included in browser and APK builds.

## Android and APK

Build the test APK locally using [scripts/android-README.md](scripts/android-README.md).
Generated APKs are excluded from Git. Open your local APK on Android and allow
installation from your browser or file manager.
Google Play is not required. The APK bundles the web app and connects to the
configured Supabase project directly, so it works without a deployed website.
Requires Android 6.0+ and a modern Android System WebView.

Build instructions: [scripts/android-README.md](scripts/android-README.md).
This is a development-signed test build. Keep the signing key outside the
repository to install future builds as updates over this installation.

Once hosted over HTTPS, the web app can also be installed as a PWA from Chrome's
“Add to Home screen” menu. The app shell and last loaded collection are available
offline. Editing, new photos and map tiles require an internet connection.
Previously viewed cafe photos can be available offline in the PWA.

The live collection starts empty. “Explore a sample collection” opens clearly
marked demo cards with illustrative names, addresses and ratings. They are never
written to the database. Illustrative photos from Unsplash:
[1](https://images.unsplash.com/photo-1442512595331-e89e73853f31),
[2](https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb),
[3](https://images.unsplash.com/photo-1554118811-1e0d58224f24).

## Cloudflare Pages

The project is ready for hosting. Automatic deployment is not configured.

- Framework: Vite; build command: `npm run build`; output directory: `dist`.
- Node.js: `22` or later.
- Build variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The frontend does not need `SUPABASE_ACCESS_TOKEN` or a service-role key.
- Changing build variables requires rebuilding the PWA and APK.

## Verification

```sh
npm test
npm run build
```

Playwright checks mobile and desktop layouts, search, combined filters, sorting,
the map, cafe details, CRUD with photos, manual coordinates and offline caching.
It detects `/usr/bin/chromium` when available; set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another installation. These tests
mock the API and do not change the live database.

To check the **real** Supabase connection, keep `npm run dev` running and execute
`node scripts/live-smoke.mjs`. It creates and deletes a temporary cafe and photo.
In a managed environment, Chromium must trust the environment's proxy certificate.
To check the production PWA, run the preview server on port 4173 and execute
`node scripts/pwa-smoke.mjs`.

Verification details: [docs/VERIFICATION.md](docs/VERIFICATION.md).
Repository migration: [docs/MIGRATION.md](docs/MIGRATION.md).

Stack: React, TypeScript, Vite, Tailwind CSS, shadcn/ui components using Radix,
Leaflet / React Leaflet / OpenStreetMap, Supabase, vite-plugin-pwa and Capacitor.
