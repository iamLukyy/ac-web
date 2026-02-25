export default defineEventHandler(async (event) => {
  requireAuth(event)
  const body = await readBody(event)
  if (!Array.isArray(body?.items)) throw createError({ statusCode: 400, statusMessage: 'Items array required' })
  await writeTextList('admins.txt', body.items)
  return { ok: true }
})
