import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpRight, Check, Coffee, Download, ExternalLink, Grid2X2, Headphones, Laptop, LoaderCircle, Map, MapPin, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Sparkles, Star, Trash2, Wifi, WifiOff, X, Zap, Clock3 } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import type { Cafe } from './types/cafe'
import { listCafes, deleteCafe } from './lib/cafes'
import { demoCafes } from './lib/demo'
import { emptyFilters, filterCafes, formatRating, noiseLabels, type Filters } from './lib/filter'
import { Button } from './components/ui/button'
import { Modal } from './components/ui/dialog'
import CafeEditor from './components/CafeEditor'
import OpeningHours from './components/OpeningHours'
import { BerlinSkyline, CatMark, WorkIllustration } from './components/BrandArt'
const CafeMap = lazy(() => import('./components/CafeMap'))
const CACHE_KEY = 'cafe-berlin-catalog-v1'
function readCache(): Cafe[] | null {
  try {
    const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return Array.isArray(data) && data.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.district === 'string' && typeof c.address === 'string' && typeof c.description === 'string' && typeof c.created_at === 'string' && typeof c.rating === 'number' && Array.isArray(c.photos)) ? data : null
  } catch { return null }
}
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

function Photo({ cafe, className = '' }: { cafe: Cafe; className?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [cafe.photos[0]])
  return cafe.photos[0] && !failed ? <img className={className} src={cafe.photos[0]} alt={`Interior of ${cafe.name}`} loading="lazy" onError={() => setFailed(true)} /> : <div className={`photo-placeholder ${className}`}><Coffee size={46} strokeWidth={1.2} /><span>A photo of your favorite spot goes here</span></div>
}

function Features({ cafe }: { cafe: Cafe }) {
  return <div className="features">{cafe.wifi && <span><Wifi size={14} /> Wi-Fi</span>}{cafe.sockets && <span><Zap size={14} /> Outlets</span>}{cafe.noise === 'quiet' && <span><Headphones size={14} /> Quiet</span>}{cafe.laptop_friendly && <span><Laptop size={14} /> Laptop friendly</span>}</div>
}

function CafeCard({ cafe, onClick }: { cafe: Cafe; onClick: () => void }) {
  return <button className="cafe-card" onClick={onClick} aria-label={`Open ${cafe.name}`}>
    <div className="card-photo"><Photo cafe={cafe} /><span className="rating-badge"><Star size={13} fill="currentColor" />{formatRating(cafe.rating)}</span>{cafe.laptop_friendly && <span className="laptop-badge"><Laptop size={13} /> Laptop friendly</span>}</div>
    <div className="card-content"><p className="district"><MapPin size={12} />{cafe.district}</p><div className="card-title"><h3>{cafe.name}</h3><ArrowUpRight size={20} /></div><p className="card-description">{cafe.description || cafe.address}</p><Features cafe={cafe} /></div>
  </button>
}

function CafeDetails({ cafe, demo, onClose, onEdit, onDelete }: { cafe: Cafe; demo: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const [photo, setPhoto] = useState(0)
  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`
  return <Modal open onOpenChange={o => !o && onClose()} title={cafe.name} description={cafe.district} className="detail-modal">
    <div className="detail-hero">{photo === 0 ? <Photo cafe={cafe} /> : <img src={cafe.photos[photo]} alt={`Photo ${cafe.name}, ${photo+1}`} />}<span className="rating-badge"><Star size={14} fill="currentColor" />{formatRating(cafe.rating)} <small>your rating</small></span><span className="detail-mascot"><CatMark /></span></div>
    {cafe.photos.length > 1 && <div className="gallery-thumbs">{cafe.photos.map((url,i) => <button key={url} onClick={() => setPhoto(i)} aria-label={`Show photo ${i+1}`} aria-pressed={photo === i}><img src={url} alt="" /></button>)}</div>}
    <div className="detail-body">{demo && <div className="demo-notice"><Sparkles size={16} /> Sample card. Names and details are illustrative.</div>}<Features cafe={cafe} /><p className="detail-description">{cafe.description || 'No description yet.'}</p>
      <div className="detail-facts"><div><MapPin size={20} /><div><small>Address</small><p>{cafe.address}</p></div></div><div><Clock3 size={20} /><div><small>Opening hours</small><OpeningHours value={cafe.hours} /></div></div><div><Headphones size={20} /><div><small>Atmosphere</small><p>{noiseLabels[cafe.noise]}</p></div></div></div>
      <div className="detail-amenities"><h3>Work essentials</h3>{[[cafe.wifi,'Wi-Fi'],[cafe.sockets,'Outlets'],[cafe.laptop_friendly,'Laptops welcome']].map(([yes,label]) => <p key={String(label)}><span>{label}</span><span className={yes ? 'available' : 'unavailable'}>{yes ? <><Check size={16} /> Available</> : 'No / not confirmed'}</span></p>)}</div>
      {!demo && <div className="detail-links"><Button asChild><a href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={17} />Get directions<ArrowUpRight size={15} /></a></Button>{/^https?:\/\//i.test(cafe.website) && <Button variant="outline" asChild><a href={cafe.website} target="_blank" rel="noreferrer">Cafe website<ExternalLink size={15} /></a></Button>}</div>}
      {!demo && <div className="detail-edit"><Button variant="ghost" onClick={onEdit}><Pencil size={16} />Edit</Button><Button variant="ghost" className="text-danger" onClick={onDelete}><Trash2 size={16} />Delete</Button></div>}
    </div>
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
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [install, setInstall] = useState<InstallPrompt | null>(null)
  const [installHelp, setInstallHelp] = useState(false)
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
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt) }
    window.addEventListener('online', online); window.addEventListener('offline', off); window.addEventListener('beforeinstallprompt', prompt)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', off); window.removeEventListener('beforeinstallprompt', prompt) }
  }, [load])
  useEffect(() => { if (Capacitor.isNativePlatform() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return; const update = registerSW({ onNeedRefresh: () => setUpdateReady(true) }); setUpdateSW(() => update) }, [])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer) }, [toast])
  const source = demo ? demoCafes : cafes
  const visible = useMemo(() => filterCafes(source, query, filters, sort), [source, query, filters, sort])
  const districts = [...new Set(source.map(c => c.district))].sort()
  const filterCount = Number(filters.wifi)+Number(filters.sockets)+Number(filters.quiet)+Number(filters.laptop)+Number(Boolean(filters.district))+Number(filters.minRating>1)
  function newCafe() { setDemo(false); setSelected(null); setEditor('new') }
  function reset() { setFilters(emptyFilters); setQuery('') }
  async function remove() {
    if (!deleting) return; setBusy(true)
    try { await deleteCafe(deleting.id); cache(cafes.filter(c => c.id !== deleting.id)); setDeleting(null); setSelected(null); setToast('Cafe deleted') }
    catch (e) { setToast(e instanceof Error ? e.message : 'Could not delete the cafe') }
    finally { setBusy(false) }
  }
  async function installApp() { if (install) { await install.prompt(); if ((await install.userChoice).outcome === 'accepted') setInstall(null) } else setInstallHelp(true) }
  const placeWord = (n: number) => n === 1 ? 'place' : 'places'
  const filtersButton = <Button aria-label="Filters" variant="outline" className={filterCount ? 'filters-button has-filters' : 'filters-button'} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={18} /><span>Filters</span>{filterCount > 0 && <b>{filterCount}</b>}</Button>
  return <div className="app-shell">
    <div className="main-shell"><header className="topbar">
      <a className="brand" href="/" aria-label="Café Berlin — home"><span className="brand-icon"><CatMark /></span><span>Berlin<small>Laptop Cafés</small></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><Grid2X2 size={17} />Discover</button><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><Map size={17} />Berlin map</button></nav>
      <div className="topbar-actions"><button className="install-button" onClick={installApp} aria-label="Install app"><Download size={18} /><span>Get the app</span></button><Button className="header-add-cafe" aria-label="Add cafe" onClick={newCafe} disabled={offline}><Plus size={18} /><span>Add cafe</span></Button></div>
    </header>
      <main>
        <section className={`hero${view === 'map' ? ' hero-compact' : ''}`}>
          <div className="hero-copy"><p className="eyebrow"><MapPin size={14} />YOUR BERLIN WORKDAY, UPGRADED</p><h1>Find your<br />work café in <em>Berlin<svg viewBox="0 0 220 16" aria-hidden="true"><path d="M4 12Q107-4 216 9" /></svg></em></h1><p className="hero-subtitle">Work, study or create. Find a café<br className="desktop-break" /> that has what you need.</p><Button className="hero-cta" onClick={() => { setView('list'); document.querySelector<HTMLInputElement>('.search-field input')?.focus(); document.getElementById('collection')?.scrollIntoView({ block: 'start' }) }}><Search size={20} />Find cafés<ArrowUpRight size={18} /></Button><div className="hero-essentials"><span><Wifi size={18} />Good Wi-Fi</span><span><Zap size={18} />Power up</span><span><Headphones size={18} />Find your focus</span></div></div>
          <div className="hero-art"><div className="skyline"><BerlinSkyline /></div><WorkIllustration /><p className="art-caption"><span />A little coffee. A lot of possibility.</p></div>
        </section>
        {(offline || cached || error) && <div className="connection-banner" role="status"><WifiOff size={18} /><span>{offline ? 'You are offline. Your saved places are available to browse.' : cached ? 'Showing your saved collection. Could not refresh the latest data.' : error}</span>{!offline && <button onClick={load}><RefreshCw size={15} />Retry</button>}</div>}
        {updateReady && <div className="connection-banner"><Sparkles size={17} /><span>A new version of the app is available.</span><button onClick={() => updateSW?.(true)}>Update</button></div>}
        <section id="collection" className="collection" aria-label="Cafe collection"><div className="collection-heading"><div><p className="eyebrow small">FIND YOUR NEXT FAVORITE SPOT</p><h2>{view === 'list' ? 'Cafés to settle into' : 'Your coffee map'} <span>{source.length}</span></h2></div><div className="view-toggle" aria-label="Collection view"><button aria-label="List" aria-pressed={view==='list'} className={view==='list' ? 'active' : ''} onClick={() => setView('list')}><Grid2X2 size={17} /><span>List</span></button><button aria-label="Map" aria-pressed={view==='map'} className={view==='map' ? 'active' : ''} onClick={() => setView('map')}><Map size={17} /><span>Map</span></button></div></div>
          {view === 'list' && <div className="search-row"><div className="search-field"><Search size={19} /><input aria-label="Search cafes" placeholder="Search by café, district or address…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={17} /></button>}</div>{filtersButton}</div>}
          <div className="filter-row"><div className="quick-filters">{([['wifi','Wi-Fi',Wifi],['sockets','Outlets',Zap],['quiet','Quiet',Headphones],['laptop','Laptop friendly',Laptop]] as const).map(([key,label,Icon]) => <button key={key} className={filters[key] ? 'chip active' : 'chip'} aria-pressed={filters[key]} onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}><Icon size={14} />{label}{filters[key] && <Check size={12} />}</button>)}</div>{view === 'map' && filtersButton}<label className="sort-select"><ArrowDownWideNarrow size={16} /><select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}><option value="rating">Top rated</option><option value="newest">Newest first</option><option value="name">Name</option></select></label></div>
          {demo && <div className="demo-banner"><Sparkles size={17} /><span><strong>Demo</strong> · Sample places, photos and ratings</span><button onClick={() => { setDemo(false); reset() }}>Back to my collection<X size={15} /></button></div>}
          {(query || filterCount > 0) && <div className="results-line"><span>Found {visible.length} {placeWord(visible.length)}</span><button onClick={reset}>Clear all<X size={13} /></button></div>}
          {loading ? <div className="skeleton-grid" aria-label="Loading cafes">{[1,2,3].map(n => <div className="skeleton-card" key={n}><div /><span /><span /></div>)}</div> : view === 'map' ? <><div className="map-container"><Suspense fallback={<div className="map-loading"><LoaderCircle className="spin" />Loading map…</div>}><CafeMap cafes={visible} onSelect={setSelected} selectedId={selected?.id} /></Suspense></div>{visible.length > 0 && <div className="map-previews" aria-label="Cafes on this map">{visible.slice(0, 3).map(cafe => <button key={cafe.id} className="map-preview" onClick={() => setSelected(cafe)} aria-label={`View ${cafe.name}`}><Photo cafe={cafe} /><div><h3>{cafe.name}</h3><p>{cafe.district}</p><Features cafe={cafe} /></div><ArrowUpRight size={18} /></button>)}</div>}{visible.length === 0 && <p className="map-empty">{source.length ? 'No places match these filters. Try different search criteria.' : 'Add your first cafe to see it on the map.'}</p>}</> : visible.length > 0 ? <div className="cafe-grid">{visible.map(cafe => <CafeCard key={cafe.id} cafe={cafe} onClick={() => setSelected(cafe)} />)}{!demo && <button className="add-card" onClick={newCafe} disabled={offline}><span><Plus size={27} /></span><h3>Another great spot</h3><p>Save your next discovery</p></button>}</div> : <div className="empty-state"><div className="empty-icon">{source.length ? <Search size={35} strokeWidth={1.4} /> : <Coffee size={39} strokeWidth={1.4} />}<span>✦</span></div><p className="eyebrow small">{source.length ? 'TRY SOMETHING DIFFERENT?' : 'EVERY COLLECTION STARTS SOMEWHERE'}</p><h3>{source.length ? 'No matches just yet' : 'Your first cafe awaits'}</h3><p>{source.length ? 'Try another search or remove a few filters.' : 'That window seat, reliable Wi-Fi and your favorite coffee.\nSave it here and keep it close at hand.'}</p>{source.length ? <Button variant="outline" onClick={reset}>Reset filters</Button> : <><Button onClick={newCafe} disabled={offline || Boolean(error)}><Plus size={17} />Add your first cafe</Button><button className="demo-link" onClick={() => { setDemo(true); reset() }}>Explore a sample collection<ArrowUpRight size={14} /></button></>}</div>}
          <footer className="collection-footer"><span><Coffee size={16} />Good coffee. Great workdays.</span><span>MADE FOR BERLIN · FIND. WORK. CAFÉ.</span></footer>
        </section>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view==='list' ? 'active' : ''} onClick={() => setView('list')}><Grid2X2 size={21} /><span>Places</span></button><button className="mobile-add" aria-label="Add cafe" onClick={newCafe} disabled={offline}><Plus size={24} /></button><button className={view==='map' ? 'active' : ''} onClick={() => setView('map')}><Map size={21} /><span>Map</span></button></nav>
    {selected && !editor && <CafeDetails key={selected.id} cafe={selected} demo={demo} onClose={() => setSelected(null)} onEdit={() => { setEditor(selected); setSelected(null) }} onDelete={() => { setDeleting(selected); setSelected(null) }} />}
    {editor && <CafeEditor cafe={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={saved => { cache([saved, ...cafes.filter(c => c.id !== saved.id)]); setEditor(null); setToast('Cafe saved'); setCached(false); setError('') }} />}
    <Modal open={filterOpen} onOpenChange={setFilterOpen} title="Find your place" description="Choose what matters for a good workday." className="filter-modal"><div className="filter-form"><div className="field"><label htmlFor="filter-district">District</label><select id="filter-district" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}><option value="">All Berlin districts</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div><div className="field"><label htmlFor="filter-rating">Minimum rating: {formatRating(filters.minRating)}</label><input id="filter-rating" type="range" min="1" max="5" step="0.1" value={filters.minRating} onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))} /></div><div className="filter-options">{([['wifi','Wi-Fi','Stay connected',Wifi],['sockets','Outlets','Keep your battery topped up',Zap],['quiet','Quiet atmosphere','Find your focus',Headphones],['laptop','Laptops welcome','Settle in and get to work',Laptop]] as const).map(([key,label,hint,Icon]) => <label key={key}><Icon size={20} /><span>{label}<small>{hint}</small></span><input type="checkbox" checked={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.checked }))} /></label>)}</div><div className="form-actions"><Button variant="outline" onClick={() => setFilters(emptyFilters)}>Reset</Button><Button onClick={() => setFilterOpen(false)}>Show {visible.length} {placeWord(visible.length)}</Button></div></div></Modal>
    <Modal open={Boolean(deleting)} onOpenChange={o => !busy && !o && setDeleting(null)} title="Delete this cafe?" description={`“${deleting?.name || ''}” and its photos will be removed from your collection.`}><div className="confirm-body"><p>This action cannot be undone.</p><div className="form-actions"><Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Keep cafe</Button><Button variant="destructive" onClick={remove} disabled={busy}>{busy && <LoaderCircle className="spin" size={16} />}Delete cafe</Button></div></div></Modal>
    <Modal open={installHelp} onOpenChange={setInstallHelp} title="Café Berlin on your phone" description="Open your collection from your home screen."><div className="install-help"><Download size={32} /><p>In Chrome on Android, open the ⋮ menu and choose “Add to Home screen” → “Install”.</p><p>On iPhone: Safari → “Share” → “Add to Home Screen”.</p><p className="muted">If the app is already installed, open it using the Café Berlin icon.</p><Button onClick={() => setInstallHelp(false)}>Got it</Button></div></Modal>
    {toast && <div className="toast" role="status"><Check size={18} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>
}
