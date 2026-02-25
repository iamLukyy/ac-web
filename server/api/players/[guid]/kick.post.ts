export default defineEventHandler(async (event) => {
  requireAuth(event)

  const guid = getRouterParam(event, 'guid')
  if (!guid) throw createError({ statusCode: 400, statusMessage: 'GUID required' })

  // Find the player's name from the server details
  const details = await getServerDetails()
  const cars = details?.players?.Cars || details?.Players?.Cars || []
  const player = cars.find((p: any) => p.ID === guid && p.IsConnected)

  if (!player) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found or not connected' })
  }

  try {
    const result = await rconCommand(`kick ${player.DriverName}`)
    return { ok: true, result }
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Kick failed: ${err.message}` })
  }
})
