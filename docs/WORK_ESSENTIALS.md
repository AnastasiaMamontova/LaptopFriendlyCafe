# Work essentials

The current interface has no Laptop friendly or Laptops welcome option in the
filters, cafe details, or editor. Good tables is a separate boolean describing
comfortable tables suitable for working. Confirm it in the editor to include a
cafe in the Good tables filter.

## Display and filtering

- Wi-Fi and outlets have icons without visible labels in cafe details. Available
  amenities are coral; absent/unconfirmed amenities are grey and crossed out.
  Accessible labels and hover titles identify the amenity and its state.
- Their filter buttons also use icons without visible labels, with accessible
  names and `aria-pressed`. A highlighted filter means "require this amenity";
  switching it off includes cafes regardless of availability. Filter icons do
  not claim that an amenity is absent at a particular cafe.
- Quiet and Good tables have text labels. Good tables combines with search,
  Wi-Fi, outlets, quiet, district, minimum rating, sorting and map results. Reset
  and Clear all remove it along with other filters.
- The editor retains explicit Wi-Fi, Outlets and Good tables checkbox labels so
  data entry is unambiguous. New cafes start with Good tables unchecked.

## Data compatibility

Apply `supabase/migrations/202611160001_good_tables.sql` before using the updated
editor. The migration is repeatable. `npm run setup:backend` also applies it,
along with the original schema migration, in filename order.

The existing legacy `laptop_friendly` column and its values remain in the database
for older installed applications. Current saves submit `good_tables` instead,
preserving the legacy column. Existing cafe rows and photo URLs are unchanged;
no Storage changes are needed. Existing rows start with Good tables unconfirmed.
Older offline collections without the new property still load, but do not match
the Good tables filter until confirmed and saved online.

The additive migration has been applied to the configured project. A database
transaction compared counts and fingerprints of all existing cafe columns
excluding the new field before and after applying it. All matched. A schema
query confirmed a non-null boolean column with default `false`.
A read-only request with the public browser key also confirmed that the new
field is available through the Data API. No test cafe or photo was written.

## Verification

All **92** mobile/desktop Playwright tests and the TypeScript/production web/PWA
build pass. The automated API tests use intercepted requests, not production writes. They
cover both icon states, combined filters and suggestions, map results, reset,
save/reload/uncheck behavior, no legacy field in saves, and older offline records.
The production web build is checked separately. The Android APK has not been
rebuilt for this change; physical-device testing has not been performed.

Production UI screenshots use illustrative data: [filters](screenshots/work-filters-mobile.png)
and [cafe details](screenshots/work-essentials-mobile.png). Filters and page width
were checked at 320, 390 and 1440 px without horizontal overflow or runtime errors.
