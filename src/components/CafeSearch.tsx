import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Cafe } from '../types/cafe'
import { useBackHandler } from '../lib/back-navigation'

export default function CafeSearch({ query, onChange, cafes, onSelect }: {
  query: string; onChange: (query: string) => void; cafes: Cafe[]; onSelect: (cafe: Cafe) => void
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const pointerInteraction = useRef(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const options = cafes.slice(0, 6)
  const expanded = open && Boolean(query.trim())
  const activeIndex = active < options.length ? active : -1
  useBackHandler(() => { setOpen(false); setActive(-1); input.current?.blur() }, { enabled: expanded, priority: 50 })
  useEffect(() => {
    // Collapse the in-flow suggestions after an outside click, so the target
    // does not move between pointer-down (input blur) and pointer-up.
    const pointer = () => { pointerInteraction.current = true }
    const keyboard = () => { pointerInteraction.current = false }
    const click = (event: MouseEvent) => {
      pointerInteraction.current = false
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', pointer, true)
    document.addEventListener('keydown', keyboard, true)
    document.addEventListener('click', click)
    return () => { document.removeEventListener('pointerdown', pointer, true); document.removeEventListener('keydown', keyboard, true); document.removeEventListener('click', click) }
  }, [])
  useEffect(() => {
    if (expanded && activeIndex >= 0) document.getElementById(`${id}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, expanded, id])
  function choose(cafe: Cafe) { setOpen(false); setActive(-1); onChange(cafe.name); onSelect(cafe) }
  return <div ref={root} className="catalog-search" onBlur={event => { if (!pointerInteraction.current && !event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <div className="search-field"><Search size={20} aria-hidden="true" />
      <input ref={input} role="combobox" aria-label="Search cafes" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-list` : undefined} aria-activedescendant={expanded && activeIndex >= 0 ? `${id}-${activeIndex}` : undefined}
        placeholder="Name, district or address" autoComplete="off" spellCheck={false} maxLength={240} value={query}
        onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1) }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Escape') { setOpen(false); setActive(-1); return }
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
            event.preventDefault(); setOpen(true)
            setActive(event.key === 'ArrowDown' ? (activeIndex + 1) % options.length : (activeIndex <= 0 ? options.length - 1 : activeIndex - 1))
          }
          if (event.key === 'Enter' && expanded && options.length) { event.preventDefault(); choose(options[activeIndex < 0 ? 0 : activeIndex]) }
        }} />
      {query && <button type="button" aria-label="Clear search" onClick={() => { onChange(''); setOpen(false); setActive(-1); input.current?.focus() }}><X size={19} /></button>}
    </div>
    {expanded && <div className="catalog-suggestions">
      <div role="listbox" aria-label="Cafe suggestions" id={`${id}-list`}>{options.map((cafe, index) =>
        <button type="button" role="option" tabIndex={-1} aria-selected={index === activeIndex} id={`${id}-${index}`} key={cafe.id} className={index === activeIndex ? 'active' : ''} onMouseDown={event => event.preventDefault()} onClick={() => choose(cafe)}>
          <Search size={18} aria-hidden="true" /><span><strong>{cafe.name}</strong><small>{cafe.district} · Cafe</small></span>
        </button>
      )}</div>
      {!options.length && <p role="status">No matching cafes in your collection.</p>}
    </div>}
  </div>
}
