import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, ImageOff, LoaderCircle, X } from 'lucide-react'
import { useRef, useState, type RefObject, type TouchEvent } from 'react'
import { useBackHandler } from '../lib/back-navigation'

function PhotoSlide({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  if (status === 'error') return <div className="photo-viewer-feedback" role="status">
    <ImageOff size={36} aria-hidden="true" /><p>This photo could not be loaded.</p>
    <button onClick={() => setStatus('loading')}>Try again</button>
  </div>
  return <>
    <img className="photo-viewer-image" src={src} alt={alt} draggable={false} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
    {status === 'loading' && <div className="photo-viewer-feedback photo-viewer-loading" role="status"><LoaderCircle size={30} className="spin" aria-hidden="true" /><span>Loading photo…</span></div>}
  </>
}

export default function PhotoViewer({ open, onOpenChange, photos, cafeName, index, onIndexChange, returnFocusRef }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: string[]
  cafeName: string
  index: number
  onIndexChange: (index: number) => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  useBackHandler(() => onOpenChange(false), { enabled: open && photos.length > 0, priority: 200 })
  const multiple = photos.length > 1
  function move(direction: number) { onIndexChange((index + direction + photos.length) % photos.length) }
  function startSwipe(event: TouchEvent) {
    const touch = event.touches[0]
    touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }
  function endSwipe(event: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start || !multiple || event.touches.length || !event.changedTouches.length) return
    const end = event.changedTouches[0]
    const dx = end.clientX - start.x
    const dy = end.clientY - start.y
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1)
  }
  if (!photos.length) return null
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="photo-viewer-overlay" />
    <Dialog.Content className="photo-viewer" onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef.current?.focus({ preventScroll: true }) }} onKeyDown={event => {
      if (!multiple || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
    }}>
      <header className="photo-viewer-header"><div>
        <Dialog.Title className="photo-viewer-title">Photos of {cafeName}</Dialog.Title>
        <p className="photo-viewer-count" role="status" aria-live="polite" aria-atomic="true">Photo {index + 1} of {photos.length}</p>
      </div><Dialog.Close className="photo-viewer-close" aria-label="Close photos"><X size={26} /></Dialog.Close></header>
      <Dialog.Description className="sr-only">Full-screen photos. Swipe or use the arrow buttons to browse. Press Escape to close.</Dialog.Description>
      <div className="photo-viewer-stage" onTouchStart={startSwipe} onTouchMove={event => { if (event.touches.length > 1) touchStart.current = null }} onTouchEnd={endSwipe} onTouchCancel={() => { touchStart.current = null }}>
        <PhotoSlide key={photos[index]} src={photos[index]} alt={`${cafeName}, photo ${index + 1} of ${photos.length}`} />
        {multiple && <><button className="photo-viewer-previous" onClick={() => move(-1)} aria-label="Previous photo"><ChevronLeft size={30} /></button><button className="photo-viewer-next" onClick={() => move(1)} aria-label="Next photo"><ChevronRight size={30} /></button></>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
}
