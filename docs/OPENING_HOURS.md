# Weekly opening hours

The cafe editor uses a Monday–Sunday schedule. For each day choose **Not added**,
**Opening times**, **Closed**, or **Open 24 hours**. Opening and closing hours and
minutes are selected from native lists; no schedule text needs to be typed.
All times use the 24-hour clock and refer to local time in Berlin.

- Set Monday, then copy it to Monday–Friday or every day to avoid repeated entry.
- Use **Add a break / another period** for a lunch break or split opening hours.
- A closing time earlier than its opening time means the next day. The editor
  and saved summary explicitly identify these overnight openings.
- Equal opening and closing times are rejected; use **Open 24 hours** instead.
- Overlapping periods are rejected, including overlaps with the previous night's
  opening and across the Sunday–Monday boundary. Touching intervals are allowed.
- **Not added** means unknown, rather than closed. Hours are optional.

## Existing records and storage

The existing `cafes.hours` text column remains in use. No database migration is
required, and saving other cafe fields preserves the original hours string.
Newly entered schedules are normalized: days in Monday–Sunday order, consecutive
identical days grouped, and periods sorted by opening time. Example:

```text
Mon–Fri 09:00–12:00, 13:00–18:00
Sat 10:15–16:00
Sun Closed
```

This keeps saved schedules readable by older app versions and tools. The current
app shows a single-line summary, grouping consecutive days with the same hours
and separating groups with a middle dot. Long schedules scroll horizontally
(with keyboard focus available) so weekends, split shifts and overnight periods
remain accessible at the larger font size. Unspecified days are not represented
as closed. Both regular data and the offline catalog cache use the same storage
representation.

Existing unambiguous English schedules such as `Daily 08:00–20:00` and
`Mon–Fri 09:00–18:00, Sat–Sun 10:00–17:00` can be edited with the selectors.
Unrecognized legacy text is displayed unchanged. Replacing it requires the
explicit **Replace with weekly schedule** action. The original can be restored
before saving. No bulk conversion of existing database records is performed.

## Design references

Reviewed for this change:

- [Google Business Profile: Edit your business hours](https://support.google.com/business/answer/15300403?hl=en):
  choose days, enter opening/closing times, add additional periods for breaks,
  and explicitly select 24-hour operation.
- [Schema.org: OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification):
  associate weekdays with opening/closing times; a closing time earlier than
  the opening time spans the following day.
- [MDN: Time input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time):
  normalized 24-hour `HH:mm` values are distinct from a browser's localized UI.
  This editor uses hour/minute selects to offer list-based entry on both
  desktop and mobile while keeping the same 24-hour presentation everywhere.

Holiday exceptions, seasonal schedules and live “open now” indicators are outside
the scope of this weekly-hours editor.
