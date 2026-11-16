import { useEffect, useLayoutEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'

const handlers = new Map<symbol, { priority: number; order: number; back: () => void }>()
let order = 0

// One native press reaches only the topmost active UI layer. A busy layer still
// consumes Back, rather than letting it close its parent or exit the app.
function dispatchBack() {
  let top: { priority: number; order: number; back: () => void } | undefined
  for (const handler of handlers.values()) {
    if (!top || handler.priority > top.priority || (handler.priority === top.priority && handler.order > top.order)) top = handler
  }
  top?.back()
}

export function useBackHandler(back: () => void, { enabled = true, priority = 100 }: { enabled?: boolean; priority?: number } = {}) {
  const current = useRef(back)
  useLayoutEffect(() => { current.current = back })
  useLayoutEffect(() => {
    if (!enabled) return
    const id = Symbol('back handler')
    handlers.set(id, { priority, order: ++order, back: () => current.current() })
    return () => { handlers.delete(id) }
  }, [enabled, priority])
}

export function useAndroidBackButton() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    let disposed = false
    const listener = NativeApp.addListener('backButton', () => { if (!disposed) dispatchBack() })
    void listener.catch(error => console.error('Could not register Android back navigation', error))
    return () => {
      disposed = true
      void listener.then(handle => handle.remove()).catch(error => console.error('Could not remove Android back listener', error))
    }
  }, [])
}
