# Weekday opening hours

The cafe editor has one fixed **Weekdays · Monday–Friday** block. Choose an
opening time and a closing time once using the hour and minute lists. There are
no day selectors, copy buttons, weekend fields or additional opening periods.
All times use the 24-hour clock and refer to local time in Berlin.

- Choosing an hour initially sets its minutes to `00`; exact minutes can still
  be selected from `00` to `59`.
- Hours are optional. Empty controls leave the schedule unknown, without saving
  an invented default. Clear both hour selectors to remove a saved time range.
- A partly entered time range cannot be saved. Opening and closing times must
  differ. A closing time earlier than opening means the following morning and
  is identified in the editor and saved summary.

## Existing records and storage

The existing `cafes.hours` text column remains in use. No database migration or
bulk conversion is required. A new interval is stored in the existing format:

```text
Mon–Fri 08:00–17:00
```

Existing single-interval Monday–Friday schedules prefill the selectors, including
exact minutes. Saving unrelated cafe fields preserves the original hours string.

Other existing schedules, including weekend hours, split shifts, 24-hour openings
and free text, appear in a **Saved hours** note. They stay unchanged during
unrelated edits. Choosing a complete new weekday time range explicitly replaces
that schedule with a single Monday–Friday interval. The editor never selects the
first period of a complex schedule or guesses how to apply a day-free legacy time.

The detail page still shows a single-line summary. Long existing schedules scroll
horizontally with keyboard focus available, so their weekend and overnight hours
remain readable. Unspecified days are not treated as closed. Both regular data
and the offline catalog cache use the same storage representation.

## References

- [Google Business Profile: Edit your business hours](https://support.google.com/business/answer/15300403?hl=en).
- [Schema.org: OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification).
- [MDN: Time input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time).

This app intentionally offers one weekday interval to match its current entry
workflow. Holiday exceptions, seasonal schedules and live “open now” indicators
are outside its scope.
