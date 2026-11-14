import { useState } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import { readWeekdayPeriod, serializeWeekdayHours, weekdayHoursError, type OpeningPeriod } from '../lib/opening-hours'

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [hour = '', minute = ''] = value.split(':')
  return <div className="hours-time-picker" role="group" aria-label={label}>
    <select aria-label={`${label} hour`} value={hour} onChange={event => onChange(event.target.value ? `${event.target.value}:${minute || '00'}` : '')}>
      <option value="">—</option>{hours.map(time => <option key={time}>{time}</option>)}
    </select>
    <span aria-hidden="true">:</span>
    <select aria-label={`${label} minute`} value={minute} onChange={event => onChange(event.target.value ? `${hour}:${event.target.value}` : hour ? `${hour}:` : '')}>
      <option value="">—</option>{minutes.map(time => <option key={time}>{time}</option>)}
    </select>
  </div>
}

export default function OpeningHoursEditor({ value, onChange, onErrorChange }: { value: string; onChange: (value: string) => void; onErrorChange: (error: string) => void }) {
  const [original] = useState(value)
  const [period, setPeriod] = useState<OpeningPeriod>(() => readWeekdayPeriod(value) || { opens: '', closes: '' })
  const [edited, setEdited] = useState(false)
  const error = edited ? weekdayHoursError(period) : ''
  function change(field: keyof OpeningPeriod, value: string) {
    const next = { ...period, [field]: value }
    const nextError = weekdayHoursError(next)
    setPeriod(next); setEdited(true); onErrorChange(nextError)
    if (!nextError) onChange(serializeWeekdayHours(next))
  }
  return <fieldset className="hours-editor" aria-describedby="hours-hint">
    <legend><Clock3 size={20} />Opening hours</legend>
    <p id="hours-hint" className="hours-hint">One time range for all weekdays. Berlin time · 24-hour clock.</p>
    <div className="hours-weekday-card">
      <div className="hours-weekday-heading"><div><strong>Weekdays</strong><span>Monday–Friday</span></div><CalendarDays size={28} aria-hidden="true" /></div>
      <div className="hours-time-fields">
        <div className="hours-time-field"><span>Opens</span><TimePicker label="Weekdays opens" value={period.opens} onChange={value => change('opens', value)} /></div>
        <div className="hours-time-field"><span>Closes</span><TimePicker label="Weekdays closes" value={period.closes} onChange={value => change('closes', value)} /></div>
      </div>
      {period.opens && period.closes && error && <p className="hours-error" role="status">{error}</p>}
      {!error && period.closes && period.closes < period.opens && <p className="hours-overnight">Closes the following morning</p>}
    </div>
    {!edited && original && !readWeekdayPeriod(original) && <div className="hours-saved-note"><p>Saved hours</p><blockquote>{original}</blockquote><p>These stay unchanged unless you choose a new weekday time range.</p></div>}
  </fieldset>
}
