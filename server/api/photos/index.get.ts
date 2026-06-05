export default defineEventHandler(() => {
  const photos = listPhotos()
  return {
    photos: photos.map((p) => ({
      id: p.id,
      caption: p.caption,
      width: p.width,
      height: p.height,
      takenAt: p.taken_at,
      src: `/api/photos/${p.id}/raw`,
      thumb: `/api/photos/${p.id}/thumb`,
    })),
  }
})
