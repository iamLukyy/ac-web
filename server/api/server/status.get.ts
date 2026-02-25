export default defineEventHandler(async (event) => {
  requireAuth(event)

  const status = await getContainerStatus()

  return status
})
