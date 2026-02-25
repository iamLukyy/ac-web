import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'

const config = useRuntimeConfig()

function getDataPath(...parts: string[]): string {
  return join(config.dataPath, ...parts)
}

// --- INI Parser (AC format) ---

export function parseINI(content: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}
  let currentSection = ''

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue

    const sectionMatch = trimmed.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      if (!result[currentSection]) result[currentSection] = {}
      continue
    }

    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/)
    if (kvMatch && currentSection) {
      result[currentSection][kvMatch[1].trim()] = kvMatch[2].trim()
    }
  }

  return result
}

export function writeINI(data: Record<string, Record<string, string>>): string {
  const lines: string[] = []

  for (const [section, values] of Object.entries(data)) {
    lines.push(`[${section}]`)
    for (const [key, value] of Object.entries(values)) {
      lines.push(`${key}=${value}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// --- YAML helpers ---

export function parseYAML(content: string): Record<string, any> {
  return (yaml.load(content) as Record<string, any>) || {}
}

export function writeYAML(data: Record<string, any>): string {
  return yaml.dump(data, { lineWidth: -1, noRefs: true })
}

// --- File I/O ---

export async function readServerConfig(): Promise<Record<string, Record<string, string>>> {
  const content = await readFile(getDataPath('cfg', 'server_cfg.ini'), 'utf-8')
  return parseINI(content)
}

export async function writeServerConfig(data: Record<string, Record<string, string>>): Promise<void> {
  await writeFile(getDataPath('cfg', 'server_cfg.ini'), writeINI(data), 'utf-8')
}

export async function readEntryList(): Promise<Record<string, Record<string, string>>> {
  const content = await readFile(getDataPath('cfg', 'entry_list.ini'), 'utf-8')
  return parseINI(content)
}

export async function writeEntryList(data: Record<string, Record<string, string>>): Promise<void> {
  await writeFile(getDataPath('cfg', 'entry_list.ini'), writeINI(data), 'utf-8')
}

export async function readExtraConfig(): Promise<Record<string, any>> {
  const content = await readFile(getDataPath('cfg', 'extra_cfg.yml'), 'utf-8')
  return parseYAML(content)
}

export async function writeExtraConfig(data: Record<string, any>): Promise<void> {
  await writeFile(getDataPath('cfg', 'extra_cfg.yml'), writeYAML(data), 'utf-8')
}

export async function readTextList(filename: string): Promise<string[]> {
  try {
    const content = await readFile(getDataPath(filename), 'utf-8')
    return content.split('\n').map(l => l.trim()).filter(Boolean)
  } catch {
    return []
  }
}

export async function writeTextList(filename: string, items: string[]): Promise<void> {
  await writeFile(getDataPath(filename), items.join('\n') + '\n', 'utf-8')
}
