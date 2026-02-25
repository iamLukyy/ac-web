export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Config data required' })

  await writeServerConfig(body)
  await regenerateContentJson()

  // Restart if requested
  if (getQuery(event).restart === 'true') {
    await restartServer()
  }

  return { ok: true }
})
