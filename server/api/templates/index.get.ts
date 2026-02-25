import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const config = useRuntimeConfig()
  const templatesPath = join(config.dataPath, 'templates.json')

  try {
    const content = await readFile(templatesPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
})
