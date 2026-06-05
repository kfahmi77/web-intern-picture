export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ caption?: string }>(event)
  const caption = (body?.caption ?? '').toString().slice(0, 280)

  const ok = await updateCaption(id, caption)
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan.' })
  }
  return { ok: true, caption }
})
