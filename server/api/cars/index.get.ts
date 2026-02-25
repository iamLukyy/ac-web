import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const config = useRuntimeConfig()
  const carsDir = join(config.dataPath, 'content', 'cars')

  try {
    const entries = await readdir(carsDir)
    const cars = []

    for (const entry of entries) {
      const carPath = join(carsDir, entry)
      const s = await stat(carPath)
      if (!s.isDirectory()) continue

      // Count skins
      let skinCount = 0
      const skins: string[] = []
      try {
        const skinsDir = join(carPath, 'skins')
        const skinEntries = await readdir(skinsDir)
        for (const skin of skinEntries) {
          const skinPath = join(skinsDir, skin)
          const skinStat = await stat(skinPath)
          if (skinStat.isDirectory()) {
            skinCount++
            skins.push(skin)
          }
        }
      } catch {
        // No skins directory
      }

      cars.push({
        id: entry,
        skinCount,
        skins
      })
    }

    return cars
  } catch {
    return []
  }
})
