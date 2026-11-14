# Android 1.0.2 verification

Application ID: `app.cafeberlin.mobile`; versionCode: **3**; minimum Android: **6.0**
(API 23); target SDK: **35**. This is a development-signed APK for direct install.

## Repository verification

The local checkout and GitHub `main` were compared before the build. All feature
commits are present, and their files match the fetched remote revision:

- `27cebca`: ivory/lavender/coral interface, artwork, cards, dialogs and map previews.
- `70e1cf9`: weekly opening-hours selectors, validation and consistent display.
- `770d006`: Berlin address autocomplete and a separate location marker on the map.

This release updates version metadata and the Android launcher/splash artwork to
match the new interface. The existing Leaflet/OpenStreetMap map remains in use;
no Google Maps SDK, API key or billing configuration was added.

## Completed checks

- Clean dependency installation from the committed lockfile.
- **54/54 Playwright tests pass** across mobile and desktop configurations.
- TypeScript, production Vite/PWA build, Capacitor Android sync, `assembleDebug`
  and `lintDebug` pass.
- Read-only access to the configured production Supabase project succeeds.
  Build settings use that project's public anon key. No live records or photos
  were created, modified or deleted during this release verification.
- All **23** production web files are byte-for-byte identical to the assets in
  the APK. The new interface, weekly-hours editor and address search are present.
- The built package has the expected application ID and version metadata.
- APK signature validation passes. Its certificate matches the previous 1.0.1
  APK, allowing an update over that installation.
- The complete APK archive was checked for the environment's management token,
  management/service-key patterns, service-role JWTs and private keystore files;
  none are included. Only the public Supabase browser settings are bundled.

Certificate SHA-256:

```text
4a91c9865576afe5c2ddbc893773e37c0a3146244b285f62f2b72c302f1ca1f4
```

APK SHA-256:

```text
babd74115519c53afd03f0a16058a1940920312ddc3bff3efb4ce1a404664adc
```

The local download is `downloads/cafe-berlin-1.0.2.apk`. The build also produces
`downloads/cafe-berlin-debug.apk` and `downloads/SHA256SUMS`. These outputs and
local configuration/signing keys stay outside Git. No APK is uploaded to GitHub.

Installation and behavior have not been tested on a physical Android device or
emulator in this environment. No site or environment was published.
