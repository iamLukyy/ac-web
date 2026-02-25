import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Template ID required' })

  const config = useRuntimeConfig()
  const templatesPath = join(config.dataPath, 'templates.json')

  let templates: any[] = []
  try {
    templates = JSON.parse(await readFile(templatesPath, 'utf-8'))
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'No templates found' })
  }

  templates = templates.filter((t: any) => t.id !== id)
  await writeFile(templatesPath, JSON.stringify(templates, null, 2), 'utf-8')

  return { ok: true }
})
