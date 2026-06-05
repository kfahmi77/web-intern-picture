export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const photo = getPhoto(id)
  if (!photo) {
    throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan.' })
  }

  await removeObjects([photo.object_key, photo.thumb_key]).catch((err) => {
    console.error('failed to remove objects for', id, err)
  })
  deletePhoto(id)

  return { ok: true }
})
