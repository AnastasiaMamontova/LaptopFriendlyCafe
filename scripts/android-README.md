# Android build

The Android app bundles the same `dist/` files as the web app. It connects to
Supabase and map tiles over HTTPS; no deployed website is required for the APK.

Prerequisites: Node.js 22+, JDK 21, Android SDK platform 35 and build-tools 35.0.0.
Install Android Studio or the official Android command-line tools, then accept
the SDK licenses and set `JAVA_HOME` and `ANDROID_HOME` for your installation.

```sh
npm ci
# Configure .env.local using .env.example before building.
npm run android:build
```

The result is `downloads/cafe-berlin-debug.apk` (also copied to `artifacts/`).
Generated APKs and checksums are local build outputs and are excluded from Git.
The current verified build is **1.0.6** (versionCode **7**); see
[release verification](../docs/ANDROID_RELEASE_1.0.6.md).
It is signed with the local
development key, so it can be installed directly on a phone after allowing APK
installation from your download source. Keep the development key if you want
future builds to update that installation without uninstalling it first.
Set `ANDROID_USER_HOME` to the directory containing your existing
`debug.keystore` when using a prepared build environment. Verify the signing
certificate matches the installed version before distributing an update.

With Android platform-tools installed and USB debugging enabled:

```sh
adb install -r downloads/cafe-berlin-debug.apk
```

For future production distribution, configure a separate release signing key
in Gradle and build `assembleRelease`. Production credentials and signing keys
must stay outside the repository. Supabase management tokens are never bundled
in the APK; only the public project URL and browser API key are used by the app.
