export default defineEventHandler(async (event) => {
  requireAuth(event)

  const cfg = await readServerConfig()
  return {
    track: cfg.SERVER?.TRACK || '',
    layout: cfg.SERVER?.CONFIG_TRACK || ''
  }
})
