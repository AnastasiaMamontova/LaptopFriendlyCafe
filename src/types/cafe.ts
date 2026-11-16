export type NoiseLevel = 'quiet' | 'moderate' | 'lively'

export interface Cafe {
  id: string
  name: string
  district: string
  address: string
  lat: number
  lng: number
  description: string
  rating: number
  wifi: boolean
  sockets: boolean
  noise: NoiseLevel
  good_tables: boolean
  hours: string
  website: string
  photos: string[]
  created_at: string
  updated_at: string
}

export type CafeInput = Omit<Cafe, 'id' | 'created_at' | 'updated_at'>
