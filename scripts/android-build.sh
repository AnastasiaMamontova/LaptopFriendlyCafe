#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo 'Set ANDROID_HOME to your Android SDK directory (Android 35 and build-tools 35.0.0 required).' >&2
  exit 1
fi

npm run build
if [[ ! -d android ]]; then
  npx cap add android
fi
node scripts/android-assets.mjs
npx cap sync android

# Gradle generates a development signing key on the first build.
# Keep that key to install future debug builds over the existing app.
(cd android && ./gradlew --no-daemon --max-workers=2 assembleDebug)

mkdir -p artifacts downloads
cp android/app/build/outputs/apk/debug/app-debug.apk artifacts/cafe-berlin-debug.apk
cp artifacts/cafe-berlin-debug.apk downloads/cafe-berlin-debug.apk
node --input-type=module - <<'JS'
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const hash = createHash('sha256').update(readFileSync('downloads/cafe-berlin-debug.apk')).digest('hex');
writeFileSync('downloads/SHA256SUMS', `${hash}  cafe-berlin-debug.apk\n`);
JS
echo 'APK: downloads/cafe-berlin-debug.apk (also copied to artifacts/)'
