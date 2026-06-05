export interface Photo {
  id: string
  caption: string
  width: number
  height: number
  takenAt: string
  src: string
  thumb: string
}

export function usePhotos() {
  const photos = useState<Photo[]>('photos', () => [])
  const pending = useState<boolean>('photos-pending', () => false)
  const error = useState<string | null>('photos-error', () => null)

  async function refresh(): Promise<Photo[]> {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<{ photos: Photo[] }>('/api/photos')
      photos.value = data.photos
      return data.photos
    } catch (e: any) {
      error.value = e?.statusMessage || 'Gagal memuat foto.'
      return []
    } finally {
      pending.value = false
    }
  }

  return { photos, pending, error, refresh }
}
