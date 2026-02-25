export default defineEventHandler(async (event) => {
  requireAuth(event)
  return await readTextList('blacklist.txt')
})
