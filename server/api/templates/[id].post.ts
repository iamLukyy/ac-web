import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Template ID required' })

  const config = useRuntimeConfig()
  const templatesPath = join(config.dataPath, 'templates.json')

  // Load templates
  let templates: any[] = []
  try {
    templates = JSON.parse(await readFile(templatesPath, 'utf-8'))
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'No templates found' })
  }

  const template = templates.find((t: any) => t.id === id)
  if (!template) throw createError({ statusCode: 404, statusMessage: 'Template not found' })

  // Build entry list from template cars
  const entryList: Record<string, Record<string, string>> = {}
  let slotIndex = 0

  for (const carId of template.cars) {
    let skin = ''
    try {
      const skinsDir = join(config.dataPath, 'content', 'cars', carId, 'skins')
      const skins = await readdir(skinsDir)
      skin = skins.find((s: string) => !s.startsWith('.')) || ''
    } catch {
      // No skins dir
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
  cfg.SERVER.TRACK = template.track
  cfg.SERVER.CONFIG_TRACK = template.layout || ''
  cfg.SERVER.NAME = template.serverName || cfg.SERVER.NAME

  // Deduplicate car list for CARS= field (unique car IDs)
  const uniqueCars = [...new Set(template.cars as string[])]
  cfg.SERVER.CARS = uniqueCars.join(';')
  cfg.SERVER.MAX_CLIENTS = String(template.cars.length)

  if (template.absAllowed !== undefined) cfg.SERVER.ABS_ALLOWED = String(template.absAllowed)
  if (template.tcAllowed !== undefined) cfg.SERVER.TC_ALLOWED = String(template.tcAllowed)

  await writeServerConfig(cfg)
  await writeEntryList(entryList)
  await regenerateContentJson()
  await restartServer()

  return { ok: true, template: template.name }
})
