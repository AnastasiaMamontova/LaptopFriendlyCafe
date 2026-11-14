# App icon

The icon shows a sleeping milk-foam cat on a coral cappuccino cup, with the handle
on the right and no steam. It uses the app's lavender, ivory and dark-plum palette.

The unchanged high-resolution master is
[`assets/branding/cappuccino-cat.png`](../assets/branding/cappuccino-cat.png).
All application icons and splash images are generated from this single source.

```sh
npm run icons:generate
```

This command regenerates image assets only. It does not build an APK, change the
application version or run Gradle.

Generated outputs:

- `public/icon.png`: 64 px browser favicon.
- `public/icons/cappuccino-cat-192.png` and `cappuccino-cat-512.png`: PWA icons;
  the 192 px variant also appears in the cafe detail card and Apple touch icon.
- `public/icons/cappuccino-cat-maskable-512.png`: padded maskable PWA icon.
- Android launcher, round and adaptive foreground PNGs in all five density
  folders under `android/app/src/main/res/mipmap-*`.
- Android splash images at their existing dimensions under `drawable*`.

PWA icon paths include the artwork name so installed clients can distinguish them
from the previous icons. The manifest, favicon, touch icon and in-app image all
reference the new assets. Generated browser assets are precached for offline use.
The full-resolution master stays outside `public/` and is not shipped to clients.

The Android build script regenerates these same assets before compiling the web
bundle and packaging it. Existing APKs remain unchanged until a new APK is
explicitly built and installed.
