# Android 1.0.4 verification

Application ID: `app.cafeberlin.mobile`; versionCode: **5**; minimum Android: **6.0**
(API 23); target SDK: **35**. Development-signed APK for direct installation.

Includes the approved cappuccino-cat launcher icon and in-app emblem, the updated
cafe detail page with larger text, four amenity tiles, personal rating below the
district, stacked directions and website buttons, and opening hours on one line.
Long schedules scroll horizontally without dropping weekend or overnight hours.
The existing full-width catalog, Berlin address suggestions, weekly-hours editor
and offline collection remain included.

## Verification

- Built from the current source after cafe detail commit `1bebbd8`, with version
  metadata updated to 1.0.4 / 5.
- Production Supabase configuration matches the selected project and uses its
  public client key. Production data and access policies were not changed.
- TypeScript, production Vite/PWA build, Capacitor Android sync, `assembleDebug`
  and `lintDebug` pass. The source interface passed all 56 mobile/desktop tests;
  four relevant detail/map tests also passed after the final emblem layering fix.
- All **23** production web files match the APK's bundled assets byte-for-byte.
  The packaged assets contain the latest detail layout, one-line opening hours
  and cappuccino-cat artwork.
- Application ID, version name, version code, minimum SDK and target SDK confirmed.
- Signature validation passes. The certificate matches Android 1.0.3, so this
  package can update the previous installation without uninstalling it.
- Archive integrity passes. The management token, privileged key patterns,
  service-role JWTs, private keystores and local environment files are absent.

APK SHA-256:

```text
57699952171d3e962accfddc1ae20076ca699405cb1f12667f76b62896e78a32
```

Certificate SHA-256:

```text
4a91c9865576afe5c2ddbc893773e37c0a3146244b285f62f2b72c302f1ca1f4
```

Local download: `downloads/cafe-berlin-1.0.4.apk` (6,384,132 bytes). The current
generic copy is `downloads/cafe-berlin-debug.apk`; checksums are recorded in
`downloads/SHA256SUMS`. Generated APKs, checksums, signing keys and local
configuration remain outside Git; the APK is delivered through the task workspace.

Physical-device/emulator installation was not performed in this environment.
