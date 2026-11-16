import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Coffee, ExternalLink, Grid2X2, Headphones, Laptop, LoaderCircle, Map, MapPin, Maximize2, Navigation, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles, Star, Wifi, WifiOff, X, Zap, Clock3 } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import type { Cafe } from './types/cafe'
import { listCafes, deleteCafe } from './lib/cafes'
import { demoCafes } from './lib/demo'
import { emptyFilters, filterCafes, formatRating, noiseLabels, type Filters } from './lib/filter'
import { Button } from './components/ui/button'
import { Modal } from './components/ui/dialog'
import CafeEditor from './components/CafeEditor'
import CafeSearch from './components/CafeSearch'
import OpeningHours from './components/OpeningHours'
import PhotoViewer from './components/PhotoViewer'
const CafeMap = lazy(() => import('./components/CafeMap'))
const CACHE_KEY = 'cafe-berlin-catalog-v1'
function readCache(): Cafe[] | null {
  try {
    const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return Array.isArray(data) && data.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.district === 'string' && typeof c.address === 'string' && typeof c.description === 'string' && typeof c.created_at === 'string' && typeof c.rating === 'number' && Array.isArray(c.photos)) ? data : null
  } catch { return null }
}

function Photo({ cafe, className = '' }: { cafe: Cafe; className?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [cafe.photos[0]])
  return cafe.photos[0] && !failed ? <img className={className} src={cafe.photos[0]} alt={`Interior of ${cafe.name}`} loading="lazy" onError={() => setFailed(true)} /> : <div className={`photo-placeholder ${className}`}><Coffee size={46} strokeWidth={1.2} /><span>A photo of your favorite spot goes here</span></div>
}

function CafeCard({ cafe, onClick }: { cafe: Cafe; onClick: () => void }) {
  return <button className="cafe-card" onClick={onClick} aria-label={`Open ${cafe.name}`}>
    <div className="card-photo"><Photo cafe={cafe} /></div>
    <div className="card-content"><div className="card-title"><h3>{cafe.name}</h3></div><p className="district">{cafe.district}</p><span className="rating-badge"><Star size={17} fill="currentColor" aria-hidden="true" />{formatRating(cafe.rating)}</span></div>
  </button>
}

function CafeDetails({ cafe, demo, onClose, onEdit, onDelete }: { cafe: Cafe; demo: boolean; onClose: () => void; onEdit: () => void; onDelete: (button: HTMLButtonElement) => void }) {
  const [photo, setPhoto] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const viewerOpenRef = useRef(false)
  const photoTrigger = useRef<HTMLButtonElement | null>(null)
  function changeViewerOpen(open: boolean) { viewerOpenRef.current = open; setViewerOpen(open) }
  function showPhoto(index: number, event: MouseEvent<HTMLButtonElement>) {
    photoTrigger.current = event.currentTarget
    setPhoto(index); changeViewerOpen(true)
  }
  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`
  const amenities = [
    { label: 'Wi-Fi', icon: Wifi, available: cafe.wifi },
    { label: 'Outlets', icon: Zap, available: cafe.sockets },
    { label: cafe.noise === 'quiet' ? 'Quiet' : 'Atmosphere', icon: Headphones, available: true, detail: cafe.noise === 'quiet' ? '' : noiseLabels[cafe.noise] },
    { label: 'Laptops welcome', icon: Laptop, available: cafe.laptop_friendly },
  ]
  return <Modal open onOpenChange={o => !o && onClose()} onEscapeKeyDown={event => {
    // A fast Escape must dismiss the photo viewer before its parent card, even
    // while the nested dialog is registering its keyboard layer.
    if (viewerOpenRef.current) { event.preventDefault(); changeViewerOpen(false) }
  }} title={cafe.name} description={cafe.district} className="detail-modal" closeIcon={<ArrowLeft size={28} />} headingContent={
    <div className="detail-rating"><Star size={20} fill="currentColor" aria-hidden="true" /><strong>{formatRating(cafe.rating)}</strong><span>· Your rating</span></div>
  }>
    <div className="detail-hero">
      {cafe.photos.length ? <button className="detail-photo" aria-label={`Enlarge photo ${photo + 1} of ${cafe.photos.length}`} onClick={event => showPhoto(photo, event)}>
        {photo === 0 ? <Photo cafe={cafe} /> : <img src={cafe.photos[photo]} alt={`Photo ${cafe.name}, ${photo+1}`} />}
        <span className="detail-photo-expand" aria-hidden="true"><Maximize2 size={21} /></span>
      </button> : <Photo cafe={cafe} />}
      {!demo && <button className="detail-hero-edit" onClick={onEdit} aria-label="Edit cafe details"><Pencil size={25} /></button>}
    </div>
    {cafe.photos.length > 1 && <div className="gallery-thumbs">{cafe.photos.map((url,i) => <button key={`${url}-${i}`} onClick={event => showPhoto(i, event)} aria-label={`Show photo ${i+1}`} aria-pressed={photo === i}><img src={url} alt="" /></button>)}</div>}
    <div className="detail-body">
      {demo && <div className="demo-notice"><Sparkles size={16} /> Sample card. Names and details are illustrative.</div>}
      <ul className="detail-essentials" aria-label="Work essentials">{amenities.map(({ label, icon: Icon, available, detail }) =>
        <li key={label} className={`detail-amenity${available ? '' : ' detail-amenity-unconfirmed'}`}>
          <Icon size={28} aria-hidden="true" /><span>{label}</span>
          {(!available || detail) && <small>{available ? detail : 'No / not confirmed'}</small>}
        </li>
      )}</ul>
      <section className="detail-about"><h3>About this cafe</h3><p className="detail-description">{cafe.description || 'No description yet.'}</p></section>
      <div className="detail-facts">
        <section><MapPin size={23} aria-hidden="true" /><div><h3>Address</h3><p>{cafe.address}</p></div></section>
        <section><Clock3 size={23} aria-hidden="true" /><div><h3>Opening hours</h3><OpeningHours value={cafe.hours} /></div></section>
      </div>
      {!demo && <div className="detail-links"><Button asChild><a href={mapUrl} target="_blank" rel="noreferrer"><Navigation size={22} />Get directions</a></Button>{/^https?:\/\//i.test(cafe.website) && <Button variant="outline" asChild><a href={cafe.website} target="_blank" rel="noreferrer"><ExternalLink size={21} />Visit website</a></Button>}</div>}
      {!demo && <div className="detail-edit"><Button variant="ghost" onClick={onEdit}>Edit cafe</Button><span aria-hidden="true">·</span><Button variant="ghost" className="text-danger" onClick={event => onDelete(event.currentTarget)}>Delete</Button></div>}
    </div>
    <PhotoViewer open={viewerOpen} onOpenChange={changeViewerOpen} photos={cafe.photos} cafeName={cafe.name} index={photo} onIndexChange={setPhoto} returnFocusRef={photoTrigger} />
  </Modal>
}

export default function App() {
  const [cafes, setCafes] = useState<Cafe[]>(() => readCache() || [])
  const [loading, setLoading] = useState(() => !readCache())
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)
  const [cached, setCached] = useState(false)
  const [demo, setDemo] = useState(false)
  const [view, setView] = useState<'list'|'map'>('list')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sort, setSort] = useState('rating')
  const [selected, setSelected] = useState<Cafe | null>(null)
  const [editor, setEditor] = useState<Cafe | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Cafe | null>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [updateReady, setUpdateReady] = useState(false)
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  const cache = useCallback((data: Cafe[]) => { setCafes(data); try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* Storage may be unavailable in private browsing. */ } }, [])
  const load = useCallback(async () => {
    const saved = readCache()
    setLoading(!saved); setError('')
    if (!navigator.onLine && saved) { cache(saved); setCached(true); setLoading(false); return }
    try { cache(await listCafes()); setCached(false) }
    catch (e) {
      if (saved) { setCafes(saved); setCached(true) }
      setError(e instanceof Error ? e.message : 'Could not load places.')
    } finally { setLoading(false) }
  }, [cache])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const online = () => { setOffline(false); void load() }; const off = () => setOffline(true)
    // The catalog has no install controls or automatic install promotion.
    const suppressInstallPrompt = (event: Event) => event.preventDefault()
    window.addEventListener('online', online); window.addEventListener('offline', off); window.addEventListener('beforeinstallprompt', suppressInstallPrompt)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', off); window.removeEventListener('beforeinstallprompt', suppressInstallPrompt) }
  }, [load])
  useEffect(() => { if (Capacitor.isNativePlatform() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return; const update = registerSW({ onNeedRefresh: () => setUpdateReady(true) }); setUpdateSW(() => update) }, [])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer) }, [toast])
  const source = demo ? demoCafes : cafes
  const visible = useMemo(() => filterCafes(source, query, filters, sort), [source, query, filters, sort])
  const districts = [...new Set(source.map(c => c.district))].sort()
  const filterCount = Number(filters.wifi)+Number(filters.sockets)+Number(filters.quiet)+Number(Boolean(filters.district))+Number(filters.minRating>1)
  function newCafe() { setDemo(false); setSelected(null); setEditor('new') }
  function reset() { setFilters(emptyFilters); setQuery('') }
  async function remove() {
    if (!deleting || busy) return; setBusy(true)
    try { await deleteCafe(deleting.id); cache(cafes.filter(c => c.id !== deleting.id)); setDeleting(null); setSelected(null); setToast('Cafe deleted') }
    catch (e) { setToast(e instanceof Error ? e.message : 'Could not delete the cafe') }
    finally { setBusy(false) }
  }
  const placeWord = (n: number) => n === 1 ? 'place' : 'places'
  const filtersButton = <Button aria-label="Filters" variant="outline" className={filterCount ? 'filters-button has-filters' : 'filters-button'} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={18} /><span>More filters</span>{filterCount > 0 && <b>{filterCount}</b>}</Button>
  return <div className="app-shell">
    <div className="main-shell">
      <main>
        {(offline || cached || error) && <div className="connection-banner" role="status"><WifiOff size={18} /><span>{offline ? 'You are offline. Your saved places are available to browse.' : cached ? 'Showing your saved collection. Could not refresh the latest data.' : error}</span>{!offline && <button onClick={load}><RefreshCw size={15} />Retry</button>}</div>}
        {updateReady && <div className="connection-banner"><Sparkles size={17} /><span>A new version of the app is available.</span><button onClick={() => updateSW?.(true)}>Update</button></div>}
        <section id="collection" className={`collection${view === 'map' ? ' collection-map' : ''}`} aria-label="Cafe collection">
          <h1 className="sr-only">Cafe collection</h1>
          {demo && <div className="demo-banner"><Sparkles size={17} /><span><strong>Demo</strong> · Sample places, photos and ratings</span><button onClick={() => { setDemo(false); reset() }}>Back to my collection<X size={15} /></button></div>}
          {view === 'list' && <section className="catalog-section search-section" aria-labelledby="search-heading">
            <div className="section-heading"><h2 id="search-heading">Search</h2></div>
            <CafeSearch query={query} onChange={setQuery} cafes={visible} onSelect={setSelected} />
          </section>}
          <section className="catalog-section filters-section" aria-labelledby="filters-heading">
            <div className="section-heading"><h2 id="filters-heading">Filters</h2></div>
            <div className="quick-filters">{([['wifi','Wi-Fi',Wifi],['sockets','Outlets',Zap],['quiet','Quiet',Headphones]] as const).map(([key,label,Icon]) => <button key={key} className={filters[key] ? 'chip active' : 'chip'} aria-pressed={filters[key]} onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}><Icon size={17} aria-hidden="true" />{label}</button>)}</div>
            <div className="filter-actions">{filtersButton}{(query || filterCount > 0) && <button className="section-action" onClick={reset}>Clear all</button>}</div>
          </section>
          {view === 'list' && <section className="catalog-section cafes-section" aria-labelledby="cafes-heading">
            <div className="section-heading"><h2 id="cafes-heading">Cafes <span className="section-count">{visible.length}</span></h2><label className="sort-select"><select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}><option value="rating">Top rated</option><option value="newest">Newest first</option><option value="name">Name</option></select></label></div>
            {loading ? <div className="skeleton-grid" aria-label="Loading cafes">{[1,2,3].map(n => <div className="skeleton-card" key={n}><div /><span /><span /></div>)}</div> : visible.length > 0 ? <div className="cafe-grid" role="region" aria-label="Cafe list" tabIndex={0}>{visible.map(cafe => <CafeCard key={cafe.id} cafe={cafe} onClick={() => setSelected(cafe)} />)}</div> : <div className="empty-state"><div className="empty-icon">{source.length ? <Search size={32} strokeWidth={1.4} /> : <Coffee size={34} strokeWidth={1.4} />}</div><h3>{source.length ? 'No matches just yet' : 'Your first cafe awaits'}</h3><p>{source.length ? 'Try another search or remove a few filters.' : 'Save a cafe to start your collection.'}</p>{source.length ? <Button variant="outline" onClick={reset}>Reset filters</Button> : <><Button onClick={newCafe} disabled={offline || Boolean(error)}><Plus size={17} />Add your first cafe</Button><button className="demo-link" onClick={() => { setDemo(true); reset() }}>Explore a sample collection<ArrowUpRight size={14} /></button></>}</div>}
          </section>}
          <section className={`catalog-section map-section${view === 'map' ? ' map-section-expanded' : ''}`} aria-labelledby="map-heading">
            <div className="section-heading"><h2 id="map-heading">Map</h2><button className="section-action" onClick={() => { setView(view === 'map' ? 'list' : 'map'); window.scrollTo(0, 0) }}>{view === 'map' ? 'Back to cafes' : 'Open map'}</button></div>
            {view === 'map' && (query || filterCount > 0) && <div className="results-line"><span>{query && `“${query}” · `}Found {visible.length} {placeWord(visible.length)}</span></div>}
            <div className="map-container"><Suspense fallback={<div className="map-loading"><LoaderCircle className="spin" />Loading map…</div>}><CafeMap key={view} compact={view === 'list'} cafes={visible} onSelect={setSelected} selectedId={selected?.id} /></Suspense></div>
            {!loading && !visible.length && <p className="map-empty">{source.length ? 'No places match these filters.' : 'Add your first cafe to see it on the map.'}</p>}
          </section>
        </section>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view==='list' ? 'active' : ''} onClick={() => { setView('list'); window.scrollTo(0, 0) }}><Grid2X2 size={21} /><span>Places</span></button><button className="mobile-add" aria-label="Add cafe" onClick={newCafe} disabled={offline}><Plus size={24} /></button><button className={view==='map' ? 'active' : ''} onClick={() => { setView('map'); window.scrollTo(0, 0) }}><Map size={21} /><span>Map</span></button></nav>
    {selected && !editor && <CafeDetails key={selected.id} cafe={selected} demo={demo} onClose={() => { if (deleting) { if (!busy) setDeleting(null) } else setSelected(null) }} onEdit={() => { setEditor(selected); setSelected(null) }} onDelete={button => { deleteButtonRef.current = button; setDeleting(selected) }} />}
    {editor && <CafeEditor cafe={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={saved => { cache([saved, ...cafes.filter(c => c.id !== saved.id)]); setEditor(null); setToast('Cafe saved'); setCached(false); setError('') }} />}
    <Modal open={filterOpen} onOpenChange={setFilterOpen} title="Find your place" description="Choose what matters for a good workday." className="filter-modal"><div className="filter-form"><fieldset className="filter-districts"><legend>District</legend><div role="group" aria-label="District"><button type="button" aria-pressed={!filters.district} onClick={() => setFilters(f => ({ ...f, district: '' }))}>All Berlin districts</button>{districts.map(d => <button type="button" key={d} aria-pressed={filters.district === d} onClick={() => setFilters(f => ({ ...f, district: d }))}>{d}</button>)}</div></fieldset><div className="field"><label htmlFor="filter-rating">Minimum rating: {formatRating(filters.minRating)}</label><input id="filter-rating" type="range" min="1" max="5" step="0.1" value={filters.minRating} onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))} /></div><div className="filter-options">{([['wifi','Wi-Fi','Stay connected',Wifi],['sockets','Outlets','Keep your battery topped up',Zap],['quiet','Quiet atmosphere','Find your focus',Headphones]] as const).map(([key,label,hint,Icon]) => <button type="button" key={key} aria-pressed={filters[key]} onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}><Icon size={20} aria-hidden="true" /><span>{label}<small>{hint}</small></span></button>)}</div><div className="form-actions"><Button variant="outline" onClick={() => setFilters(emptyFilters)}>Reset</Button><Button onClick={() => setFilterOpen(false)}>Show {visible.length} {placeWord(visible.length)}</Button></div></div></Modal>
    <Modal open={Boolean(deleting)} onOpenChange={o => !busy && !o && setDeleting(null)} role="alertdialog" className="delete-modal" overlayClassName="delete-overlay" initialFocusRef={cancelDeleteRef} closeDisabled={busy} onCloseAutoFocus={event => {
      event.preventDefault()
      const target = deleteButtonRef.current?.isConnected ? deleteButtonRef.current : document.querySelector<HTMLButtonElement>('.mobile-add')
      target?.focus({ preventScroll: true })
    }} title="Delete this cafe?" description={`Are you sure you want to delete “${deleting?.name || ''}” and all its photos?`}><div className="confirm-body"><p>This action cannot be undone.</p><div className="form-actions"><button ref={cancelDeleteRef} className="button button-outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button><Button variant="destructive" onClick={remove} disabled={busy}>{busy && <LoaderCircle className="spin" size={16} />}{busy ? 'Deleting…' : 'Delete cafe'}</Button></div></div></Modal>
    {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>
}
