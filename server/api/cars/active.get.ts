export default defineEventHandler(async (event) => {
  requireAuth(event)

  const cfg = await readServerConfig()
  const carString = cfg.SERVER?.CARS || ''
  const cars = carString.split(';').filter(Boolean)

  const entryList = await readEntryList()
  const entries = Object.entries(entryList)
    .filter(([key]) => key.startsWith('CAR_'))
    .map(([key, val]) => ({
      slot: key,
      model: val.MODEL || '',
      skin: val.SKIN || '',
      spectator: val.SPECTATOR_MODE === '1'
    }))

  return { cars, entries }
})
