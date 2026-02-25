export default defineEventHandler(async (event) => {
  requireAuth(event)

  const guid = getRouterParam(event, 'guid')
  if (!guid) throw createError({ statusCode: 400, statusMessage: 'GUID required' })

  // Find the player's name from the server details
  const details = await getServerDetails()
  const cars = details?.players?.Cars || details?.Players?.Cars || []
  const player = cars.find((p: any) => p.ID === guid && p.IsConnected)

  // Add to blacklist file
  const blacklist = await readTextList('blacklist.txt')
  if (!blacklist.includes(guid)) {
    blacklist.push(guid)
    await writeTextList('blacklist.txt', blacklist)
  }

  // Kick via RCON if connected
  if (player) {
    try {
      await rconCommand(`ban ${player.DriverName}`)
    } catch {
      // Already added to blacklist, kick on next restart
    }
  }

  return { ok: true }
})
