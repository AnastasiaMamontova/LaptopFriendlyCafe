export const weekDays = [
  { short: 'Mon', name: 'Monday' }, { short: 'Tue', name: 'Tuesday' },
  { short: 'Wed', name: 'Wednesday' }, { short: 'Thu', name: 'Thursday' },
  { short: 'Fri', name: 'Friday' }, { short: 'Sat', name: 'Saturday' },
  { short: 'Sun', name: 'Sunday' },
] as const

export interface OpeningPeriod { opens: string; closes: string }
export interface DayHours {
  status: 'unknown' | 'closed' | 'all-day' | 'open'
  periods: OpeningPeriod[]
}
export type WeeklyHours = DayHours[]
export const emptyWeek = (): WeeklyHours => weekDays.map(() => ({ status: 'unknown', periods: [] }))
export const defaultPeriod = (): OpeningPeriod => ({ opens: '09:00', closes: '18:00' })
const timePattern = '(?:[01]\\d|2[0-3]):[0-5]\\d'
const periodPattern = new RegExp(`^(${timePattern})\\s*[–-]\\s*(${timePattern})(?: \\(\\+1 day\\))?$`)
const dayPattern = '(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)'
const linePattern = new RegExp(`^(Daily|Every day|${dayPattern}(?:\\s*[–-]\\s*${dayPattern})?)\\s*:?\\s+(.+)$`, 'i')

function dayIndex(text: string) {
  return weekDays.findIndex(day => day.short.toLowerCase() === text.slice(0, 3).toLowerCase())
}

// Keep the existing text column readable by older app versions. Only parse
// complete, unambiguous English schedules; never guess the meaning of free text.
export function parseOpeningHours(value: string): WeeklyHours | null {
  const week = emptyWeek()
  if (!value.trim()) return week
  const lines = value.trim().split(new RegExp(`\\s*(?:[;\\n]|,(?=\\s*(?:${dayPattern}|Daily|Every day)))\\s*`, 'i'))
  for (const line of lines) {
    const match = line.trim().match(linePattern)
    if (!match) return null
    const [, days, body] = match
    const range = days.split(/\s*[–-]\s*/)
    const start = /^(daily|every day)$/i.test(days) ? 0 : dayIndex(range[0])
    const end = /^(daily|every day)$/i.test(days) ? 6 : dayIndex(range[1] || range[0])
    if (start < 0 || end < 0) return null
    let hours: DayHours
    if (/^closed$/i.test(body)) hours = { status: 'closed', periods: [] }
    else if (/^(?:open )?24 hours$/i.test(body)) hours = { status: 'all-day', periods: [] }
    else {
      const periods: OpeningPeriod[] = []
      for (const part of body.split(/\s*,\s*/)) {
        const times = part.match(periodPattern)
        if (!times) return null
        if (part.includes('(+1 day)') && times[2] >= times[1]) return null
        periods.push({ opens: times[1], closes: times[2] })
      }
      hours = { status: 'open', periods }
    }
    for (let offset = 0; offset <= (end - start + 7) % 7; offset++) {
      const day = (start + offset) % 7
      if (week[day].status !== 'unknown') return null
      week[day] = { ...hours, periods: hours.periods.map(period => ({ ...period })) }
    }
  }
  return week
}

export function formatDayHours(day: DayHours): string {
  if (day.status === 'unknown') return 'Not added'
  if (day.status === 'closed') return 'Closed'
  if (day.status === 'all-day') return 'Open 24 hours'
  return [...day.periods].sort((a, b) => a.opens.localeCompare(b.opens)).map(({ opens, closes }) => `${opens}–${closes}${closes < opens ? ' (+1 day)' : ''}`).join(', ')
}

export function serializeOpeningHours(week: WeeklyHours): string {
  const lines: string[] = []
  for (let start = 0; start < 7; start++) {
    if (week[start].status === 'unknown') continue
    const value = formatDayHours(week[start])
    let end = start
    while (end < 6 && formatDayHours(week[end + 1]) === value) end++
    lines.push(`${weekDays[start].short}${end > start ? `–${weekDays[end].short}` : ''} ${value}`)
    start = end
  }
  return lines.join('\n')
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
export function validateWeeklyHours(week: WeeklyHours): string {
  const spans: { start: number; end: number; day: number }[] = []
  for (const [day, hours] of week.entries()) {
    if (hours.status === 'all-day') spans.push({ start: day * 1440, end: (day + 1) * 1440, day })
    if (hours.status !== 'open') continue
    if (!hours.periods.length) return `${weekDays[day].name}: add an opening period.`
    for (const period of hours.periods) {
      if (!new RegExp(`^${timePattern}$`).test(period.opens) || !new RegExp(`^${timePattern}$`).test(period.closes)) return `${weekDays[day].name}: choose valid opening and closing times.`
      const start = minutes(period.opens)
      const end = minutes(period.closes)
      if (start === end) return `${weekDays[day].name}: opening and closing times must differ. Choose “Open 24 hours” for an all-day opening.`
      spans.push({ start: day * 1440 + start, end: day * 1440 + end + (end < start ? 1440 : 0), day })
    }
  }
  // Duplicate one week to catch a Sunday night period overlapping Monday.
  const repeated = [...spans, ...spans.map(span => ({ ...span, start: span.start + 10080, end: span.end + 10080 }))].sort((a, b) => a.start - b.start)
  for (let i = 1; i < repeated.length; i++) {
    if (repeated[i].start < repeated[i - 1].end) return `${weekDays[repeated[i].day].name}: opening periods overlap. Check this day and any overnight opening from the previous day.`
  }
  return ''
}

export function openingHoursError(value: string): string {
  const parsed = parseOpeningHours(value)
  return parsed ? validateWeeklyHours(parsed) : ''
}
