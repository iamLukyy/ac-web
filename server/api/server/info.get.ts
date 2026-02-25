export default defineEventHandler(async () => {
  try {
    return await getServerInfo()
  } catch {
    return null
  }
})
