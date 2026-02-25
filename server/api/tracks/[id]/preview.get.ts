import { readdir, stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Track ID required' })

  const config = useRuntimeConfig()
  const trackDir = join(config.dataPath, 'content', 'tracks', id)
  const layout = getQuery(event).layout as string | undefined

  // If layout specified, try ui/<layout>/preview.png first
  if (layout) {
    for (const ext of ['preview.png', 'preview.jpg']) {
      try {
        const path = join(trackDir, 'ui', layout, ext)
        await stat(path)
        const data = await readFile(path)
        setResponseHeader(event, 'Content-Type', ext.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
        setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
        return data
      } catch { /* try next */ }
    }
  }

  // Try ui/preview.png (track without layouts or fallback)
  for (const ext of ['preview.png', 'preview.jpg']) {
    try {
      const path = join(trackDir, 'ui', ext)
      await stat(path)
      const data = await readFile(path)
      setResponseHeader(event, 'Content-Type', ext.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
      setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
      return data
    } catch { /* try next */ }
  }

  // Try first layout's preview
  try {
    const uiDir = join(trackDir, 'ui')
    const entries = await readdir(uiDir)
    for (const entry of entries) {
      if (entry.startsWith('.')) continue
      const s = await stat(join(uiDir, entry))
      if (!s.isDirectory()) continue
      for (const ext of ['preview.png', 'preview.jpg']) {
        try {
          const path = join(uiDir, entry, ext)
          await stat(path)
          const data = await readFile(path)
          setResponseHeader(event, 'Content-Type', ext.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
          setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
          return data
        } catch { /* try next */ }
      }
    }
  } catch { /* no ui dir */ }

  throw createError({ statusCode: 404, statusMessage: 'No preview image found' })
})
