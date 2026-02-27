import { join } from 'node:path'
import { readdir, unlink, copyFile } from 'node:fs/promises'
import formidable from 'formidable'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const config = useRuntimeConfig()
  const carsDir = join(config.dataPath, 'content', 'cars')
  const downloadsDir = join(config.dataPath, '..', 'downloads')

  // Stream upload directly to disk (no memory buffering)
  const form = formidable({
    maxFileSize: 500 * 1024 * 1024,
    uploadDir: '/tmp',
    keepExtensions: true
  })

  const [, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
    form.parse(event.node.req, (err, fields, files) => {
      if (err) reject(createError({ statusCode: 400, statusMessage: err.message || 'Upload failed' }))
      else resolve([fields, files])
    })
  })

  const uploaded = Array.isArray(files.file) ? files.file[0] : files.file
  if (!uploaded) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const filename = uploaded.originalFilename || ''
  if (!isSupportedArchive(filename)) {
    await unlink(uploaded.filepath).catch(() => {})
    throw createError({ statusCode: 400, statusMessage: 'Supported formats: .zip, .7z, .rar, .tar.gz' })
  }

  try {
    const before = new Set(await readdir(carsDir).catch(() => []))

    await extractArchive(uploaded.filepath, carsDir)

    const after = await readdir(carsDir).catch(() => [])
    const newFolders = after.filter(f => !before.has(f))

    // For .zip originals, copy directly as CM download
    if (filename.toLowerCase().endsWith('.zip') && newFolders.length === 1) {
      await copyFile(uploaded.filepath, join(downloadsDir, `${newFolders[0]}.zip`))
    }

    // Auto-create CM download zips for any missing ones
    const created = await ensureDownloadZips(carsDir, downloadsDir)

    await regenerateContentJson()
    return { ok: true, extracted: newFolders, zipsCreated: created }
  } finally {
    await unlink(uploaded.filepath).catch(() => {})
  }
})
