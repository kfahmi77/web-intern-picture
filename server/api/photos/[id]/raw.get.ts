export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  const photo = getPhoto(id)
  if (!photo) {
    throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan.' })
  }

  setHeader(event, 'Content-Type', photo.mime)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  try {
    const stream = await getObjectStream(photo.object_key)
    return sendStream(event, stream)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Gagal mengambil foto dari penyimpanan.' })
  }
})
