export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  if (!body?.track) throw createError({ statusCode: 400, statusMessage: 'Track required' })

  const cfg = await readServerConfig()
  cfg.SERVER.TRACK = body.track
  cfg.SERVER.CONFIG_TRACK = body.layout || ''

  await writeServerConfig(cfg)
  await restartServer()

  return { ok: true }
})
