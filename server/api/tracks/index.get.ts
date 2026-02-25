import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const config = useRuntimeConfig()
  const tracksDir = join(config.dataPath, 'content', 'tracks')

  try {
    const entries = await readdir(tracksDir)
    const tracks = []

    for (const entry of entries) {
      const trackPath = join(tracksDir, entry)
      const s = await stat(trackPath)
      if (!s.isDirectory()) continue

      // Check for layouts (subdirectories with ui/ folder or data/surfaces.ini)
      const layouts: string[] = []
      try {
        const subEntries = await readdir(trackPath)
        for (const sub of subEntries) {
          const subPath = join(trackPath, sub)
          const subStat = await stat(subPath)
          const excluded = ['ui', 'data', 'ai', 'sfx', 'skins', 'extension', 'models', 'textures']
          if (subStat.isDirectory() && !sub.startsWith('.') && !excluded.includes(sub)) {
            layouts.push(sub)
          }
        }
      } catch {
        // No subdirectories
      }

      tracks.push({
        id: entry,
        layouts: layouts.length > 0 ? layouts : null
      })
    }

    return tracks
  } catch {
    return []
  }
})
