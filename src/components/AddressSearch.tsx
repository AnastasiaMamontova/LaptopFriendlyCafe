import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { searchBerlinAddresses, type BerlinAddress } from '../lib/address-search'

export default function AddressSearch({ onSelect, onClear }: { onSelect: (address: BerlinAddress) => void; onClear: () => void }) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedQuery, setSelectedQuery] = useState('')
  const [addresses, setAddresses] = useState<BerlinAddress[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, id, open])
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    setAddresses([]); setActive(-1); setError('')
    if (!online || query.trim().length < 3 || query === selectedQuery) { setStatus('idle'); return }
    const controller = new AbortController()
    setStatus('waiting')
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      try {
        const results = await searchBerlinAddresses(query, controller.signal)
        if (!controller.signal.aborted) { setAddresses(results); setStatus('ready') }
      } catch (error) {
        if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : 'Could not search addresses.'); setStatus('error') }
      }
    }, 450)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, selectedQuery, online, retry])
  function choose(address: BerlinAddress) {
    setSelectedQuery(address.label); setQuery(address.label); setOpen(false); setActive(-1)
    onSelect(address); input.current?.focus()
  }
  function clear() {
    setQuery(''); setSelectedQuery(''); setOpen(false); setAddresses([]); onClear(); input.current?.focus()
  }
  const expanded = open && query.trim().length >= 3 && query !== selectedQuery
  return <div className="address-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <label htmlFor={`${id}-input`}>Find an address in Berlin</label>
    <div className="address-input-wrap"><Search size={18} /><input ref={input} id={`${id}-input`} role="combobox" type="text" autoComplete="off" spellCheck={false} maxLength={240} aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-list` : undefined} aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-hint`} placeholder="Street and number…" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setSelectedQuery(''); setOpen(true); setActive(-1); onClear() }} onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && addresses.length) {
        event.preventDefault(); setOpen(true)
        setActive(index => event.key === 'ArrowDown' ? (index + 1) % addresses.length : (index <= 0 ? addresses.length - 1 : index - 1))
      }
      if (event.key === 'Enter' && expanded && addresses.length) { event.preventDefault(); choose(addresses[active < 0 ? 0 : active]) }
    }} />{status === 'loading' && <LoaderCircle size={17} className="spin" aria-hidden="true" />}{query && <button type="button" aria-label="Clear address search" onClick={clear}><X size={18} /></button>}</div>
    <p id={`${id}-hint`} className="address-hint">Berlin only · Choose an address to center the map</p>
    {expanded && <div className="address-dropdown">
      <div className="address-results" id={`${id}-list`} role="listbox" aria-label="Berlin address suggestions">{addresses.map((address, index) => <button type="button" role="option" tabIndex={-1} aria-selected={index === active} id={`${id}-option-${index}`} key={address.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(address)} className={index === active ? 'active' : ''}><MapPin size={17} /><span><strong>{address.label}</strong><small>{address.context}</small></span></button>)}</div>
      <div className="address-feedback" role="status" aria-live="polite">{!online ? 'Address search needs an internet connection.' : status === 'waiting' || status === 'loading' ? 'Searching Berlin addresses…' : status === 'error' ? <>{error}<button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></> : status === 'ready' && !addresses.length ? 'No matching Berlin addresses. Try a street name and number.' : status === 'ready' ? `${addresses.length} ${addresses.length === 1 ? 'address suggestion' : 'address suggestions'}.` : null}</div>
      <div className="address-attribution"><a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a><span> · </span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
    </div>}
  </div>
}
