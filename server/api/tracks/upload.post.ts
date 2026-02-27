import { join } from 'node:path'
import { writeFile, unlink, readdir, copyFile } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const file = formData[0]
  if (!file.filename) throw createError({ statusCode: 400, statusMessage: 'No filename' })
  if (!isSupportedArchive(file.filename)) {
    throw createError({ statusCode: 400, statusMessage: 'Supported formats: .zip, .7z, .rar, .tar.gz' })
  }

  const config = useRuntimeConfig()
  const tracksDir = join(config.dataPath, 'content', 'tracks')
  const downloadsDir = join(config.dataPath, '..', 'downloads')
  const tmpPath = join('/tmp', `upload_${Date.now()}_${file.filename}`)

  await writeFile(tmpPath, file.data)

  try {
    // Snapshot existing dirs before extraction
    const before = new Set(await readdir(tracksDir).catch(() => []))

    // Extract archive into content/tracks/
    await extractArchive(tmpPath, tracksDir)

    // Find newly extracted folders
    const after = await readdir(tracksDir).catch(() => [])
    const newFolders = after.filter(f => !before.has(f))

    // Create CM download zips
    if (file.filename.toLowerCase().endsWith('.zip')) {
      if (newFolders.length === 1) {
        await copyFile(tmpPath, join(downloadsDir, `${newFolders[0]}.zip`))
      } else {
        await copyFile(tmpPath, join(downloadsDir, file.filename))
      }
    }

    // Ensure all content folders have matching download zips
    const created = await ensureDownloadZips(tracksDir, downloadsDir)

    await regenerateContentJson()
    return { ok: true, extracted: newFolders, zipsCreated: created }
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
})
