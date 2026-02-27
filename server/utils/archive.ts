import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, stat, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const execAsync = promisify(exec)

const SUPPORTED_EXTENSIONS = ['.zip', '.7z', '.rar', '.tar.gz', '.tgz']

export function isSupportedArchive(filename: string): boolean {
  const lower = filename.toLowerCase()
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext))
}

export async function extractArchive(archivePath: string, destDir: string): Promise<void> {
  const lower = archivePath.toLowerCase()

  await mkdir(destDir, { recursive: true })

  if (lower.endsWith('.zip')) {
    await execAsync(`unzip -o "${archivePath}" -d "${destDir}"`)
  } else if (lower.endsWith('.7z')) {
    await execAsync(`7z x "${archivePath}" -o"${destDir}" -y`)
  } else if (lower.endsWith('.rar')) {
    await execAsync(`unrar x -o+ "${archivePath}" "${destDir}/"`)
  } else if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    await execAsync(`tar -xzf "${archivePath}" -C "${destDir}"`)
  } else {
    throw new Error(`Unsupported archive format`)
  }
}

/**
 * Ensures every folder in contentDir has a matching .zip in downloadsDir.
 * Creates missing zips automatically.
 * Returns list of newly created zips.
 */
export async function ensureDownloadZips(
  contentDir: string,
  downloadsDir: string
): Promise<string[]> {
  await mkdir(downloadsDir, { recursive: true })

  const contentItems = await readdir(contentDir).catch(() => [] as string[])
  const downloadFiles = new Set(
    (await readdir(downloadsDir).catch(() => [] as string[]))
      .filter(f => f.endsWith('.zip'))
      .map(f => f.replace('.zip', ''))
  )

  const created: string[] = []

  for (const item of contentItems) {
    const itemPath = join(contentDir, item)
    const s = await stat(itemPath).catch(() => null)
    if (!s?.isDirectory()) continue

    if (!downloadFiles.has(item)) {
      const zipPath = join(downloadsDir, `${item}.zip`)
      await execAsync(`cd "${contentDir}" && zip -r "${zipPath}" "${item}"`)
      created.push(item)
    }
  }

  return created
}
