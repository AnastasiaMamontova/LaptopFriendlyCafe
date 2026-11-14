import { formatDayHours, parseOpeningHours, weekDays } from '../lib/opening-hours'

export default function OpeningHours({ value }: { value: string }) {
  const week = parseOpeningHours(value)
  if (!value.trim()) return <p>Not added yet</p>
  if (!week) return <p className="legacy-hours-display">{value}</p>
  return <dl className="opening-hours-list" aria-label="Weekly opening hours">{weekDays.map((day, index) => <div key={day.short} className={week[index].status === 'unknown' ? 'hours-unspecified' : ''}><dt>{day.name}</dt><dd>{formatDayHours(week[index]).replaceAll(', ', '\n')}</dd></div>)}</dl>
}
