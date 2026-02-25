export default defineEventHandler(async (event) => {
  requireAuth(event)

  try {
    const details = await getServerDetails()
    const players = (details?.Players || details?.players || []).map((p: any) => ({
      name: p.Name || p.name || 'Unknown',
      guid: p.Guid || p.guid || '',
      car: p.Car || p.car || '',
      isConnected: p.IsConnected ?? p.isConnected ?? true
    }))
    return players
  } catch {
    return []
  }
})
