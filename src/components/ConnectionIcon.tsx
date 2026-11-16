import { Wifi, WifiOff, Zap, ZapOff } from 'lucide-react'

/** Availability uses both color and a slash; filtering uses aria-pressed. */
export default function ConnectionIcon({ kind, available, size = 28 }: { kind: 'wifi' | 'sockets'; available: boolean; size?: number }) {
  const Icon = kind === 'wifi' ? (available ? Wifi : WifiOff) : (available ? Zap : ZapOff)
  return <Icon size={size} aria-hidden="true" />
}
