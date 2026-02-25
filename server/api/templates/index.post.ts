import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  if (!body?.id || !body?.name || !body?.track || !body?.cars) {
    throw createError({ statusCode: 400, statusMessage: 'id, name, track, and cars required' })
  }

  const config = useRuntimeConfig()
  const templatesPath = join(config.dataPath, 'templates.json')

  let templates: any[] = []
  try {
    templates = JSON.parse(await readFile(templatesPath, 'utf-8'))
  } catch {
    // Start fresh
  }

  // Check for duplicate ID
  const existingIndex = templates.findIndex((t: any) => t.id === body.id)
  if (existingIndex >= 0) {
    templates[existingIndex] = body
  } else {
    templates.push(body)
  }

  await writeFile(templatesPath, JSON.stringify(templates, null, 2), 'utf-8')

  return { ok: true }
})
