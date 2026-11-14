import { useState } from 'react'
import { Clock3, Copy, Plus, X } from 'lucide-react'
import { defaultPeriod, emptyWeek, parseOpeningHours, serializeOpeningHours, validateWeeklyHours, weekDays, type DayHours, type OpeningPeriod, type WeeklyHours } from '../lib/opening-hours'
import { Button } from './ui/button'

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [hour, minute] = value.split(':')
  return <div className="hours-time-picker" role="group" aria-label={label}>
    <select aria-label={`${label} hour`} value={hour} onChange={event => onChange(`${event.target.value}:${minute}`)}>{hours.map(time => <option key={time}>{time}</option>)}</select>
    <span aria-hidden="true">:</span>
    <select aria-label={`${label} minute`} value={minute} onChange={event => onChange(`${hour}:${event.target.value}`)}>{minutes.map(time => <option key={time}>{time}</option>)}</select>
  </div>
}

export default function OpeningHoursEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [week, setWeek] = useState<WeeklyHours>(() => parseOpeningHours(value) || emptyWeek())
  const [legacy, setLegacy] = useState(() => parseOpeningHours(value) === null)
  const [original] = useState(value)
  const error = legacy ? '' : validateWeeklyHours(week)
  function change(next: WeeklyHours) { setWeek(next); onChange(serializeOpeningHours(next)) }
  function changeDay(index: number, day: DayHours) { change(week.map((current, i) => i === index ? day : current)) }
  function changePeriod(day: number, index: number, field: keyof OpeningPeriod, value: string) {
    changeDay(day, { ...week[day], periods: week[day].periods.map((period, i) => i === index ? { ...period, [field]: value } : period) })
  }
  function copyMonday(count: number) {
    change(week.map((day, index) => index < count ? { ...week[0], periods: week[0].periods.map(period => ({ ...period })) } : day))
  }
  return <fieldset className="hours-editor" aria-describedby="hours-hint">
    <legend><Clock3 size={17} />Opening hours</legend>
    <p id="hours-hint" className="hours-hint">Choose days and times. All times are local to Berlin, in 24-hour format. Leave unknown days as “Not added”.</p>
    {legacy ? <div className="hours-legacy"><p>Previously entered hours</p><blockquote>{original}</blockquote><p>Keep this text, or replace it with a weekly schedule. It will stay unchanged until you replace it.</p><Button type="button" variant="outline" size="sm" onClick={() => { setLegacy(false); change(emptyWeek()) }}>Replace with weekly schedule</Button></div> : <>
      <div className="hours-copy"><span><Copy size={14} />Copy Monday to:</span><button type="button" disabled={week[0].status === 'unknown'} onClick={() => copyMonday(5)}>Mon–Fri</button><button type="button" disabled={week[0].status === 'unknown'} onClick={() => copyMonday(7)}>Every day</button></div>
      <div className="hours-days">{weekDays.map((day, index) => <div className="hours-day" key={day.short}>
        <div className="hours-day-heading"><span id={`hours-day-${index}`}>{day.name}</span><select aria-label={`${day.name} hours`} value={week[index].status} onChange={event => {
          const status = event.target.value as DayHours['status']
          changeDay(index, { status, periods: status === 'open' ? (week[index].periods.length ? week[index].periods : [defaultPeriod()]) : [] })
        }}><option value="unknown">Not added</option><option value="open">Opening times</option><option value="closed">Closed</option><option value="all-day">Open 24 hours</option></select></div>
        {week[index].status === 'open' && <div className="hours-periods" role="group" aria-labelledby={`hours-day-${index}`}>{week[index].periods.map((period, periodIndex) => <div className="hours-period" key={periodIndex}>
          <div className="hours-time-fields"><div className="hours-time-field"><span>Opens</span><TimePicker label={`${day.name} period ${periodIndex + 1} opens`} value={period.opens} onChange={value => changePeriod(index, periodIndex, 'opens', value)} /></div><span className="hours-separator" aria-hidden="true">–</span><div className="hours-time-field"><span>Closes</span><TimePicker label={`${day.name} period ${periodIndex + 1} closes`} value={period.closes} onChange={value => changePeriod(index, periodIndex, 'closes', value)} /></div>{week[index].periods.length > 1 && <button type="button" className="hours-remove" aria-label={`Remove ${day.name} period ${periodIndex + 1}`} onClick={() => changeDay(index, { ...week[index], periods: week[index].periods.filter((_, i) => i !== periodIndex) })}><X size={16} /></button>}</div>
          {period.closes < period.opens && <p className="hours-overnight">Closes the next day</p>}
        </div>)}<button className="hours-add" type="button" onClick={() => changeDay(index, { ...week[index], periods: [...week[index].periods, { opens: '18:00', closes: '22:00' }] })}><Plus size={14} />Add a break / another period</button></div>}
      </div>)}</div>
      {error && <p className="hours-error" role="status">{error}</p>}
      {original && <button type="button" className="hours-restore" onClick={() => { setWeek(parseOpeningHours(original) || emptyWeek()); setLegacy(parseOpeningHours(original) === null); onChange(original) }}>Restore previously saved hours</button>}
    </>}
  </fieldset>
}
