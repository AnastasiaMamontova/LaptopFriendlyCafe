import type { Cafe } from '../types/cafe'
export interface Filters { wifi: boolean; sockets: boolean; quiet: boolean; good_tables: boolean; district: string; minRating: number }
export const emptyFilters: Filters = { wifi: false, sockets: false, quiet: false, good_tables: false, district: '', minRating: 1 }
export function filterCafes(cafes: Cafe[], query: string, filters: Filters, sort: string) {
  const q = query.trim().toLocaleLowerCase()
  return cafes.filter(c => (!q || `${c.name} ${c.district} ${c.address}`.toLocaleLowerCase().includes(q)) && (!filters.wifi || c.wifi) && (!filters.sockets || c.sockets) && (!filters.quiet || c.noise === 'quiet') && (!filters.good_tables || c.good_tables === true) && (!filters.district || c.district === filters.district) && c.rating >= filters.minRating)
    .sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name, 'de') : sort === 'newest' ? b.created_at.localeCompare(a.created_at) : b.rating - a.rating || a.name.localeCompare(b.name, 'de'))
}
export const noiseLabels = { quiet: 'Quiet', moderate: 'Moderate noise', lively: 'Lively' }
export const formatRating = (n: number) => n.toFixed(1)
