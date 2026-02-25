export default defineEventHandler(async (event) => {
  requireAuth(event)

  try {
    const details = await getServerDetails()
    const cars = details?.players?.Cars || details?.Players?.Cars || []
    return cars
      .filter((p: any) => p.IsConnected)
      .map((p: any) => ({
        name: p.DriverName || 'Unknown',
        guid: p.ID || '',
        car: p.Model || '',
        nation: p.DriverNation || '',
        team: p.DriverTeam || '',
        skin: p.Skin || ''
      }))
  } catch {
    return []
  }
})
