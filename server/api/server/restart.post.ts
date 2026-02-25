export default defineEventHandler(async (event) => {
  requireAuth(event)

  await restartServer()

  return { ok: true }
})
