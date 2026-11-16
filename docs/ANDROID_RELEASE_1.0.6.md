# Android 1.0.6 verification

Application ID: `app.cafeberlin.mobile`; versionCode: **7**; minimum Android: **6.0**
(API 23); target SDK: **35**. Development-signed APK for direct installation.

Includes all interface changes through commit `9768c76`:

- Four separate home sections: Search, Filters, Cafes and Map; compact typography
  and cafe rows; no visible app heading or Install app control.
- Immediate cafe suggestions matching names, districts and addresses, including
  offline use. Filters and districts use buttons without checkmarks or dropdowns.
- Map preview and large map with Berlin address suggestions.
- Full-screen photos with swipes, arrows, a counter, error/retry feedback and
  return to the same cafe and selected photo.
- Compact cafe details with a shorter photo, overlapping thumbnails, inline
  district/rating, plain amenity rows and no cat emblem on the detail page.
- A separate English delete-confirmation dialog with Cancel focused initially,
  no deletion before confirmation, and repeat-action protection while pending.
- One Monday–Friday time interval, hour/minute lists and the Berlin time hint.
- Plain Cafe / Cafes spelling. The approved cat launcher/PWA icon is retained.

## Verification

- TypeScript, production web/PWA build, Capacitor sync, Android `assembleDebug`
  and `lintDebug` pass.
- The source interface passed all **76** mobile/desktop Playwright tests; six
  focused deletion/gallery checks passed after the final confirmation styling.
  Packaging changes only increment version metadata.
- All **23** production web files match their bundled APK counterparts byte-for-byte.
  The current UI features and English confirmation are present in the package;
  removed controls and the detail cat emblem are absent.
- The APK uses the configured production Supabase URL and public client key;
  test credentials, management tokens, privileged keys, service-role JWTs,
  private keystores and environment files are absent.
- APK integrity and signature validation pass. The certificate matches 1.0.5,
  allowing installation as an update. Package ID, version and SDK levels match.
- No production cafe records or access policies were changed.

APK SHA-256:

```text
85553b2a0009a7bbe675b1264f0a7fbd9f15e2aa33f7b6752ecbbb1ecb1c14fa
```

Certificate SHA-256:

```text
4a91c9865576afe5c2ddbc893773e37c0a3146244b285f62f2b72c302f1ca1f4
```

Local download: `downloads/cafe-berlin-1.0.6.apk` (6,384,839 bytes). The current
generic copy is `downloads/cafe-berlin-debug.apk`; checksums are recorded in
`downloads/SHA256SUMS`. APKs, checksums, signing keys and local configuration
remain outside Git. Earlier versioned APKs are unchanged.

Physical-device/emulator installation was not performed in this environment.
