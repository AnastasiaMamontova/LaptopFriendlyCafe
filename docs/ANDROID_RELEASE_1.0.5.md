# Android 1.0.5 verification

Application ID: `app.cafeberlin.mobile`; versionCode: **6**; minimum Android: **6.0**
(API 23); target SDK: **35**. Development-signed APK for direct installation.

## Included changes

- Plain Cafe / Cafes spelling in the collection heading, search placeholder,
  detail labels, page title and PWA app name. The application remains Cafe Berlin;
  no alternative proposed name was selected. Cafe names stored by users are unchanged.
- “Laptop-friendly cafes” collection heading. The laptop filter and repeated
  laptop badges are removed from the catalog and map previews. The three remaining
  quick filters are Wi-Fi, Outlets and Quiet.
- Removed the Install app button and its help dialog. No install control was
  moved elsewhere. Existing offline collection support remains.
- One fixed Weekdays / Monday–Friday time interval, selected with hour/minute
  lists. The hint reads only “Berlin time”. There are no day selectors, copy
  controls, breaks or additional periods. Old schedules survive unrelated edits.
- The approved cappuccino-cat icon, full-width catalog, large-text cafe detail
  design and single-line opening-hours summary remain included.
- The existing Berlin address suggestions, map, gallery and cafe CRUD remain.

## Verification

- Production Supabase configuration matches the selected project and uses its
  public client key. The APK contains that production URL/key and does not contain
  the UI test configuration. Production records and access policies were unchanged.
- All **62** mobile/desktop Playwright tests passed, including the weekday editor,
  catalog filters, map, photo CRUD and offline cache. Backend requests were mocked.
- TypeScript, production Vite/PWA build, Capacitor Android sync, `assembleDebug`
  and `lintDebug` passed.
- Production UI was also checked at widths of 320, 390 and 1440 px without
  horizontal overflow or browser runtime errors. The new heading, three catalog
  filters, removed install button, detail typography and simplified hours were
  verified together. Screenshots use illustrative fixture data:
  [catalog top](screenshots/catalog-top-mobile.png),
  [catalog bottom](screenshots/catalog-bottom-mobile.png),
  [hours form](screenshots/opening-hours-mobile.png),
  [hours field](screenshots/weekday-hours-field.png).
- All **23** production web files match the APK's bundled assets byte-for-byte.
  The packaged assets contain the latest changes; removed labels and controls
  are absent. The app ID, version, minimum SDK and target SDK were confirmed.
- Archive integrity and signature validation passed. The certificate matches
  Android 1.0.4, allowing an update over the previous installation.
- The management token, privileged key patterns, service-role JWTs, private
  keystores and local environment files are absent from the archive.

APK SHA-256:

```text
13309bb392358b3b02f568b214d178cf38ba4fdff8492914f28023c5a40ad769
```

Certificate SHA-256:

```text
4a91c9865576afe5c2ddbc893773e37c0a3146244b285f62f2b72c302f1ca1f4
```

Local download: `downloads/cafe-berlin-1.0.5.apk` (6,383,086 bytes). The current
generic copy is `downloads/cafe-berlin-debug.apk`; checksums are recorded in
`downloads/SHA256SUMS`. Generated APKs, checksums, signing keys and local
configuration remain outside Git; the APK is delivered through the task workspace.

Physical-device/emulator installation was not performed in this environment.
