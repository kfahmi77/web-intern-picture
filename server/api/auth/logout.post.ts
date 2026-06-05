export default defineEventHandler((event) => {
  logout(event)
  return { ok: true }
})
