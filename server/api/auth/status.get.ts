export default defineEventHandler(async (event) => {
  return { authed: await isAuthed(event) }
})
