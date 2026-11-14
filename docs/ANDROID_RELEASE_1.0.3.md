# Android 1.0.3 verification

Application ID: `app.cafeberlin.mobile`; versionCode: **4**; minimum Android: **6.0**
(API 23); target SDK: **35**. Development-signed APK for direct installation.

Includes the latest interface changes: no application header or welcome banner,
full-width content, larger typography, a viewport-fitted map, one search field
per view and one add-cafe button in the bottom navigation. Weekly opening hours
and Berlin address suggestions remain included.

## Verification

- Production Supabase build settings match the configured project and use its
  public anon key. No production data or access policies were changed.
- TypeScript, production Vite/PWA build, Capacitor Android sync, `assembleDebug`
  and `lintDebug` pass. The source interface was verified with the 54-test suite.
- All **23** production web files match the APK's bundled assets byte-for-byte.
- Expected application ID, version name, version code and minimum SDK confirmed.
- Signature validation passes and the certificate matches the 1.0.2 APK, so this
  package can update that installation.
- The APK contains the latest layout and address/hours features. The removed
  header and welcome-banner controls are absent from the compiled assets.
- The complete archive was checked for the management token, management/service
  key patterns, service-role JWTs and private keystore files; none are included.

APK SHA-256:

```text
899b1e4b4b4a1ecb2c91fe3bc02c92b00aecd3f19467eca00b849ee88f95a8f3
```

Certificate SHA-256:

```text
4a91c9865576afe5c2ddbc893773e37c0a3146244b285f62f2b72c302f1ca1f4
```

Local download: `downloads/cafe-berlin-1.0.3.apk`. Generated APKs, checksums,
private signing keys and local configuration remain outside Git; the APK is
delivered through the task workspace rather than uploaded to GitHub.

Physical-device/emulator installation was not performed in this environment.
