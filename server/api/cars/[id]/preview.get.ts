import { readdir, stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Car ID required' })

  const config = useRuntimeConfig()
  const carDir = join(config.dataPath, 'content', 'cars', id)

  // Try skin preview first (first skin with preview.jpg/png)
  try {
    const skinsDir = join(carDir, 'skins')
    const skins = await readdir(skinsDir)
    for (const skin of skins) {
      if (skin.startsWith('.')) continue
      for (const ext of ['preview.jpg', 'preview.png']) {
        const previewPath = join(skinsDir, skin, ext)
        try {
          await stat(previewPath)
          const data = await readFile(previewPath)
          setResponseHeader(event, 'Content-Type', ext.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
          setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
          return data
        } catch { /* try next */ }
      }
    }
  } catch { /* no skins dir */ }

  // Try ui/preview.png
  for (const ext of ['preview.png', 'preview.jpg']) {
    try {
      const path = join(carDir, 'ui', ext)
      await stat(path)
      const data = await readFile(path)
      setResponseHeader(event, 'Content-Type', ext.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
      setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
      return data
    } catch { /* try next */ }
  }

  throw createError({ statusCode: 404, statusMessage: 'No preview image found' })
})
