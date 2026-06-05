export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const password = (body?.password || '').toString()
  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password kosong.' })
  }
  const ok = await login(event, password)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Password salah.' })
  }
  return { ok: true }
})
