import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const file = formData[0]
  if (!file.filename) throw createError({ statusCode: 400, statusMessage: 'No filename' })

  const config = useRuntimeConfig()
  const tracksDir = join(config.dataPath, 'content', 'tracks')
  const tmpPath = join('/tmp', file.filename)

  // Write temp file
  const { writeFile, unlink } = await import('node:fs/promises')
  await writeFile(tmpPath, file.data)

  try {
    // Extract archive
    if (file.filename.endsWith('.zip')) {
      await execAsync(`unzip -o "${tmpPath}" -d "${tracksDir}"`)
    } else if (file.filename.endsWith('.tar.gz') || file.filename.endsWith('.tgz')) {
      await execAsync(`tar -xzf "${tmpPath}" -C "${tracksDir}"`)
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Only .zip and .tar.gz supported' })
    }

    return { ok: true }
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
})
