# Home-page layout and cafe search

The approved design is implemented as four separate rounded sections:

- **Search:** an accessible combobox with immediate suggestions after the first
  non-whitespace character. Suggestions match cafe names, districts and addresses
  in the current collection and respect active filters and sorting. Up to six
  suggestions are shown; the list scrolls when needed. This local search works
  with the offline cache and does not call a geocoding service.
- **Filters:** Wi-Fi, Outlets and Quiet are toggle buttons. A selected button uses
  a coral border/fill and `aria-pressed`, without checkmarks or dropdowns. More
  filters opens district buttons, amenity buttons and the minimum-rating slider.
- **Cafes:** compact photo/name/district/rating rows with a result count and sort
  selector. All matching cafes remain available in a scrollable list; none are
  silently truncated to the first two visible rows.
- **Map:** an OpenStreetMap preview showing the same matching cafes. It does not
  capture map drag/zoom gestures while the user scrolls the home page. Open map
  or the bottom Map navigation opens the large interactive map with the existing
  Berlin address suggestions. Places returns to the home sections. The catalog
  search is hidden in the large map view so address search remains the single
  search input there.

There is no visible app title/banner above Search. A screen-reader-only page
heading preserves document structure. Section headings use 20 px text, cafe names
18 px and search input 16 px. Cafe details use their own compact layout.

## Search interaction

Arrow keys move through suggestions; Enter opens the selected cafe (or the first
suggestion). Escape closes suggestions while preserving the query. Clicking or
tapping a suggestion opens the same detail view as a cafe row. Clear search
restores the full set of cafes within the current filters; Clear all resets both.
Empty search results are identified explicitly.

Pointer interactions outside the in-flow suggestions close them after the click
is handled, preventing a collapsing list from moving the intended filter button
between pointer-down and pointer-up. Keyboard focus leaving the search closes it.

## Verification

- All 72 Playwright tests passed on mobile and desktop. The final catalog layout
  also passed its 30-test suite after spacing and Clear all placement were refined.
- TypeScript and the production Vite/PWA build passed.
- The production interface was checked at widths of 320, 390 and 1440 px for
  overflow, immediate suggestions, selected filter buttons, map expansion and
  return navigation, with no browser runtime errors.
- Screenshots use illustrative cafe fixtures and local photos. Map tiles are
  OpenStreetMap; no production cafe data was changed:
  [complete mobile page](screenshots/home-zones-mobile.png),
  [mobile search suggestions](screenshots/home-search-mobile.png),
  [desktop page](screenshots/home-zones-desktop.png).
- No APK was built. Existing APKs remain unchanged and do not yet include this
  redesign or the preceding full-screen photo viewer.
