export default defineEventHandler(async (event) => {
  requireAuth(event)
  return await readServerConfig()
})
