# Android system Back navigation

The app uses the official `@capacitor/app` Android Back event. One press is sent
only to the topmost active screen or popup. It does not directly finish the app.

| Current state | Back action |
| --- | --- |
| Full-screen photos | Close photos and return to the same cafe and selected photo. |
| Delete confirmation | Cancel without deleting anything. |
| Cafe editor | Use the existing Cancel behavior and release unsaved photo previews; return to the cafe when editing, or the previous collection/map when adding. |
| Filters dialog | Close the dialog, keeping the chosen filters. |
| Cafe/address suggestions | Close suggestions and release input focus, keeping the query. |
| Cafe details | Return to the collection or map from which it was opened. |
| Large map | Return to the home collection, retaining its filters. |
| Home with a search query | Clear the query. |
| Sample collection | Return to the user's collection. |
| Home collection | Ask “Exit app?” with Stay focused by default. |
| Exit confirmation | Close it, equivalent to Stay. Only the explicit Exit app action invokes native exit. |

While a save or confirmed deletion is pending, its modal consumes Back without
closing or allowing the event to fall through to the home screen. Normal browser
Back is not intercepted in the web/PWA version.

## Implementation

`src/lib/back-navigation.ts` owns one native listener and a registry of active
handlers. Screens have priority 0, suggestion popups 50, dialogs 100, and photos
200. At the same priority, the most recently opened dialog wins. Handlers are
registered in layout effects and read the latest committed callbacks. Listener
cleanup also handles React StrictMode's asynchronous mount/unmount cycle.

The native plugin and generated Gradle project references are committed. The
usual `npm run android:build` command synchronizes the plugin into the next APK.

## Verification

- All **84** mobile/desktop Playwright tests passed. Android-specific tests invoke
  the official Capacitor plugin proxy through a mocked native bridge, including
  callbacks with `canGoBack: false` (the condition that previously exited).
- Verified photo/card/map transitions, suggestions, filter state, delete
  cancellation, editor return, pending save/delete protection, StrictMode listener
  cleanup and explicit native exit. Web browser Back is checked separately.
- TypeScript and the production web/PWA build passed. Android plugin sync finds
  `@capacitor/app@7.1.2`; native Java compilation and Android lint passed
  without assembling an APK.
- Backend and map-provider calls in automated tests are intercepted. No
  production records or access policies were changed.

The existing Android 1.0.6 APK has not been rebuilt and does not include this
behavior. A new APK must be built and installed to enable it on a phone.
Physical button/gesture testing on an actual Android device was not performed.

[Exit confirmation screenshot](screenshots/android-exit-confirmation-mobile.png)
uses the mocked Android bridge and illustrative cafe data.
