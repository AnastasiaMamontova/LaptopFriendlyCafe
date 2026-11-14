import { useState, type FormEvent } from 'react'
import { ImagePlus, LoaderCircle, LocateFixed, X } from 'lucide-react'
import type { Cafe, CafeInput } from '../types/cafe'
import { saveCafe, uploadPhoto, deletePhoto } from '../lib/cafes'
import { Button } from './ui/button'
import { Modal } from './ui/dialog'
import OpeningHoursEditor from './OpeningHoursEditor'
import { openingHoursError } from '../lib/opening-hours'

const districts = ['Mitte','Prenzlauer Berg','Kreuzberg','Friedrichshain','Neukölln','Charlottenburg','Schöneberg','Wedding','Moabit','Tiergarten','Wilmersdorf','Steglitz','Tempelhof','Treptow','Lichtenberg','Pankow','Reinickendorf','Spandau','Köpenick','Marzahn','Hellersdorf','Zehlendorf','Other district']
const initial: CafeInput = { name: '', district: '', address: '', description: '', lat: 52.52, lng: 13.405, rating: 4, wifi: false, sockets: false, noise: 'moderate', laptop_friendly: true, hours: '', website: '', photos: [] }

async function compressPhoto(file: File): Promise<File> {
  if (file.size > 20 * 1024 * 1024) throw new Error('This photo is too large. Choose a file up to 20 MB.')
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('JPG, PNG and WebP photos are supported.')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not process this photo')), 'image/jpeg', .86))
  return new File([blob], 'cafe.jpg', { type: 'image/jpeg' })
}

export default function CafeEditor({ cafe, onClose, onSaved }: { cafe?: Cafe; onClose: () => void; onSaved: (cafe: Cafe) => void }) {
  const [form, setForm] = useState<CafeInput>(cafe ? { ...cafe } : initial)
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationNote, setLocationNote] = useState('')
  const [locationConfirmed, setLocationConfirmed] = useState(Boolean(cafe))
  const [coordinatesOpen, setCoordinatesOpen] = useState(!cafe)
  function update<K extends keyof CafeInput>(key: K, value: CafeInput[K]) { setForm(f => ({ ...f, [key]: value })) }
  function close() { if (!saving) { files.forEach(f => URL.revokeObjectURL(f.preview)); onClose() } }
  async function locate() {
    setLocating(true); setError(''); setLocationNote('')
    try {
      if (!form.address.trim()) throw new Error('Enter the cafe address first.')
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&viewbox=13.08,52.68,13.76,52.33&bounded=1&q=${encodeURIComponent(form.address + ', Berlin')}`)
      if (!response.ok) throw new Error('Address search is temporarily unavailable. Enter coordinates manually.')
      const data = await response.json()
      if (!data[0]) throw new Error('Address not found. Check the street and number or enter coordinates manually.')
      update('lat', Number(data[0].lat)); update('lng', Number(data[0].lon)); setLocationConfirmed(true)
      setLocationNote('Address found. Coordinates updated.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not find the address') } finally { setLocating(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!locationConfirmed) { setError('Find the address on the map or enter coordinates manually.'); return }
    if (!Number.isFinite(form.lat) || !Number.isFinite(form.lng) || form.lat < -90 || form.lat > 90 || form.lng < -180 || form.lng > 180) { setError('Check the coordinates.'); return }
    if (form.website && !/^https?:\/\//i.test(form.website)) { setError('Website URLs must start with https:// or http://'); return }
    const hoursError = openingHoursError(form.hours)
    if (hoursError) { setError(hoursError); return }
    setSaving(true)
    const uploaded: string[] = []
    try {
      for (const { file } of files) uploaded.push(await uploadPhoto(await compressPhoto(file)))
      const { name, district, address, description, lat, lng, rating, wifi, sockets, noise, laptop_friendly, hours, website } = form
      const saved = await saveCafe({ name: name.trim(), district: district.trim(), address: address.trim(), description: description.trim(), lat, lng, rating, wifi, sockets, noise, laptop_friendly, hours: hours.trim(), website: website.trim(), photos: [...form.photos, ...uploaded] }, cafe?.id)
      files.forEach(f => URL.revokeObjectURL(f.preview)); onSaved(saved)
    } catch (e) {
      await Promise.allSettled(uploaded.map(deletePhoto))
      setError(e instanceof Error ? e.message : 'Could not save the cafe. Please try again.')
    } finally { setSaving(false) }
  }
  return <Modal open onOpenChange={open => !open && close()} title={cafe ? 'Edit cafe' : 'New place'} description="Save a place you will want to come back to." className="editor-modal">
    <form onSubmit={submit} className="editor-form">
      <fieldset disabled={saving} className="form-fields">
      <div className="field"><label htmlFor="cafe-name">Name <span>*</span></label><input id="cafe-name" required maxLength={120} placeholder="What is the cafe called?" value={form.name} onChange={e => update('name', e.target.value)} /></div>
      <div className="field"><label htmlFor="cafe-district">District <span>*</span></label><input id="cafe-district" required list="district-options" maxLength={80} placeholder="For example, Kreuzberg" value={form.district} onChange={e => update('district', e.target.value)} /><datalist id="district-options">{districts.map(d => <option key={d} value={d} />)}</datalist></div>
      <div className="field"><label htmlFor="cafe-address">Address <span>*</span></label><input id="cafe-address" disabled={locating} required maxLength={240} placeholder="Street and building number" value={form.address} onChange={e => { update('address', e.target.value); setLocationConfirmed(false); setLocationNote('') }} /></div>
      <Button variant="outline" type="button" onClick={locate} disabled={locating || !form.address}>{locating ? <LoaderCircle className="spin" size={17} /> : <LocateFixed size={17} />} Find coordinates by address</Button>
      {locationNote && <p className="success-note" role="status">{locationNote}</p>}
      <details className="coordinates" open={coordinatesOpen} onToggle={e => setCoordinatesOpen(e.currentTarget.open)}><summary>Map coordinates</summary><div className="field-row"><div className="field"><label htmlFor="cafe-lat">Latitude</label><input id="cafe-lat" type="number" step="any" min="-90" max="90" required value={form.lat} onChange={e => { update('lat', e.target.valueAsNumber); setLocationConfirmed(true) }} /></div><div className="field"><label htmlFor="cafe-lng">Longitude</label><input id="cafe-lng" type="number" step="any" min="-180" max="180" required value={form.lng} onChange={e => { update('lng', e.target.valueAsNumber); setLocationConfirmed(true) }} /></div></div></details>
      <div className="field"><label htmlFor="cafe-description">About this place</label><textarea id="cafe-description" rows={4} maxLength={5000} placeholder="What do you like here? Where is the best spot for a laptop?" value={form.description} onChange={e => update('description', e.target.value)} /></div>
      <div className="field"><label>Photos <small>up to 6 photos · JPG, PNG, WebP</small></label><div className="photo-editor">{form.photos.map((p,i) => <div className="photo-thumb" key={p}><img src={p} alt={`Cafe photo ${i+1}`} /><button type="button" aria-label={`Remove photo ${i+1}`} onClick={() => update('photos', form.photos.filter(x => x !== p))}><X size={15} /></button></div>)}{files.map((f,i) => <div className="photo-thumb" key={f.preview}><img src={f.preview} alt={`New photo ${i+1}`} /><button type="button" aria-label={`Remove new photo ${i+1}`} onClick={() => { URL.revokeObjectURL(f.preview); setFiles(fs => fs.filter(x => x !== f)) }}><X size={15} /></button></div>)}{form.photos.length + files.length < 6 && <label className="photo-upload"><ImagePlus size={25} /><span>Add photo</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Upload photos" onChange={e => { const selected = Array.from(e.target.files || []).slice(0, 6-form.photos.length-files.length); setFiles(fs => [...fs, ...selected.map(file => ({ file, preview: URL.createObjectURL(file) }))]); e.target.value = '' }} /></label>}</div></div>
      <div className="rating-editor"><label htmlFor="cafe-rating">Your rating</label><output htmlFor="cafe-rating">★ {form.rating.toFixed(1)}</output><input id="cafe-rating" aria-label="Your rating" type="range" min="1" max="5" step="0.1" value={form.rating} onChange={e => update('rating', Number(e.target.value))} /><div><span>1 — not for me</span><span>5 — a favorite</span></div></div>
      <div className="field"><label>Work essentials</label><div className="check-grid">{([['wifi','Wi-Fi'],['sockets','Outlets'],['laptop_friendly','Laptops welcome']] as const).map(([key,label]) => <label className="checkbox-option" key={key}><input type="checkbox" checked={form[key]} onChange={e => update(key, e.target.checked)} />{label}</label>)}</div></div>
      <div className="field"><label htmlFor="cafe-noise">Noise level</label><select id="cafe-noise" value={form.noise} onChange={e => update('noise', e.target.value as CafeInput['noise'])}><option value="quiet">Quiet — easy to focus</option><option value="moderate">Moderate noise</option><option value="lively">Lively</option></select></div>
      <OpeningHoursEditor value={form.hours} onChange={value => update('hours', value)} />
      <div className="field"><label htmlFor="cafe-website">Website</label><input id="cafe-website" type="url" maxLength={500} placeholder="https://" value={form.website} onChange={e => update('website', e.target.value)} /></div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Button variant="outline" type="button" onClick={close} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving || locating}>{saving && <LoaderCircle size={17} className="spin" />}{saving ? 'Saving…' : cafe ? 'Save changes' : 'Add cafe'}</Button></div>
    </form>
  </Modal>
}
