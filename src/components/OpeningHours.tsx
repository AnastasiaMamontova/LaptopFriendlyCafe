import { parseOpeningHours, serializeOpeningHours } from '../lib/opening-hours'

export default function OpeningHours({ value }: { value: string }) {
  const week = parseOpeningHours(value)
  const summary = (week ? serializeOpeningHours(week) : value.trim()).replace(/\r?\n/g, ' · ') || 'Not added yet'
  // Keep every saved period readable on one line, including weekends and legacy text.
  // Keyboard users can focus and horizontally scroll a long schedule.
  return <div className="opening-hours-summary" role="region" aria-label="Opening hours schedule" tabIndex={0} title={summary}>{summary}</div>
}
