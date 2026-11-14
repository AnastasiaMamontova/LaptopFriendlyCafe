import { supabase } from './supabase'
import type { Cafe, CafeInput } from '../types/cafe'
import { openingHoursError } from './opening-hours'

const BUCKET = 'cafe-photos'
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Add the connection settings and rebuild the app.')
  return supabase
}

export async function listCafes(): Promise<Cafe[]> {
  const { data, error } = await client().from('cafes').select('*').order('created_at', { ascending: false })
  if (error) throw new Error('Could not load cafes. Check your internet connection.')
  return (data ?? []) as Cafe[]
}

function validate(input: CafeInput): CafeInput {
  if (!input.name.trim()) throw new Error('Enter the cafe name.')
  if (!input.address.trim()) throw new Error('Enter the cafe address.')
  if (!input.district.trim()) throw new Error('Enter the cafe district.')
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90 || !Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
    throw new Error('Check the cafe coordinates.')
  }
  if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5 || Math.abs(input.rating * 10 - Math.round(input.rating * 10)) > 0.00001) {
    throw new Error('Rating must be between 1 and 5 in steps of 0.1.')
  }
  if (!['quiet', 'moderate', 'lively'].includes(input.noise)) throw new Error('Choose a noise level.')
  if (input.website.trim()) {
    try {
      const website = new URL(input.website)
      if (!['http:', 'https:'].includes(website.protocol)) throw new Error()
    } catch { throw new Error('Enter a website URL starting with https://.') }
  }
  const hoursError = openingHoursError(input.hours)
  if (hoursError) throw new Error(hoursError)
  return {
    ...input,
    name: input.name.trim(), address: input.address.trim(), district: input.district.trim(),
    description: input.description.trim(), hours: input.hours.trim(), website: input.website.trim(),
    photos: input.photos.filter(Boolean),
  }
}

export async function saveCafe(input: CafeInput, id?: string): Promise<Cafe> {
  const values = validate(input)
  let previousPhotos: string[] = []
  if (id) {
    const previous = await client().from('cafes').select('photos').eq('id', id).maybeSingle()
    previousPhotos = previous.data?.photos ?? []
  }
  const query = id
    ? client().from('cafes').update(values).eq('id', id)
    : client().from('cafes').insert(values)
  const { data, error } = await query.select('*').single()
  if (error) throw new Error('Could not save the cafe. Check your connection and try again.')
  await Promise.allSettled(previousPhotos.filter(photo => !values.photos.includes(photo)).map(deletePhoto))
  return data as Cafe
}

export async function deleteCafe(id: string): Promise<void> {
  const previous = await client().from('cafes').select('photos').eq('id', id).maybeSingle()
  const { data, error } = await client().from('cafes').delete().eq('id', id).select('id')
  if (error) throw new Error('Could not delete the cafe. Please try again.')
  if (!data?.length) throw new Error('This cafe has already been deleted. Refresh the collection.')
  await Promise.allSettled(((previous.data?.photos ?? []) as string[]).map(deletePhoto))
}

export async function uploadPhoto(file: File): Promise<string> {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/avif': 'avif', 'image/gif': 'gif',
  }
  const extension = extensions[file.type]
  if (!extension) throw new Error('Choose a JPEG, PNG, WebP, AVIF or GIF image.')
  if (file.size > MAX_PHOTO_SIZE) throw new Error('Photos must be smaller than 10 MB.')
  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await client().storage.from(BUCKET).upload(path, file, {
    contentType: file.type, cacheControl: '31536000', upsert: false,
  })
  if (error) throw new Error('Could not upload the photo. Please try again.')
  return client().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function deletePhoto(url: string): Promise<void> {
  const storage = client().storage.from(BUCKET)
  const prefix = storage.getPublicUrl('').data.publicUrl
  if (!url.startsWith(prefix)) return
  const path = decodeURIComponent(url.slice(prefix.length))
  if (!path || path.includes('..')) return
  const { error } = await storage.remove([path])
  if (error) throw new Error('Could not delete the photo.')
}
