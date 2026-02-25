export default defineEventHandler(async (event) => {
  requireAuth(event)
  return await readTextList('admins.txt')
})
