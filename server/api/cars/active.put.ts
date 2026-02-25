import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  if (!body?.cars || !Array.isArray(body.cars)) {
    throw createError({ statusCode: 400, statusMessage: 'Cars array required' })
  }

  const config = useRuntimeConfig()

  // Build entry list: 1 slot per car with first available skin
  const entryList: Record<string, Record<string, string>> = {}
  let slotIndex = 0

  for (const carId of body.cars) {
    let skin = ''
    try {
      const skinsDir = join(config.dataPath, 'content', 'cars', carId, 'skins')
      const skins = await readdir(skinsDir)
      skin = skins.find(s => !s.startsWith('.')) || ''
    } catch {
      // No skins
    }

    entryList[`CAR_${slotIndex}`] = {
      MODEL: carId,
      SKIN: skin,
      SPECTATOR_MODE: '0',
      DRIVERNAME: '',
      TEAM: '',
      GUID: '',
      BALLAST: '0',
      RESTRICTOR: '0'
    }
    slotIndex++
  }

  // Update server_cfg.ini
  const cfg = await readServerConfig()
  cfg.SERVER.CARS = body.cars.join(';')
  cfg.SERVER.MAX_CLIENTS = String(body.cars.length)

  await writeServerConfig(cfg)
  await writeEntryList(entryList)
  await restartServer()

  return { ok: true }
})
