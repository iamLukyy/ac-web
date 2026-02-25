import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const config = useRuntimeConfig()
  const extraCfg = await readExtraConfig()
  const enabledPlugins: string[] = extraCfg.EnablePlugins || []

  // Scan plugins directory
  const pluginsDir = join(config.dataPath, 'plugins')
  const plugins: { name: string; enabled: boolean; hasConfig: boolean }[] = []

  try {
    const entries = await readdir(pluginsDir)
    for (const entry of entries) {
      if (!entry.endsWith('.dll')) continue
      const name = entry.replace('.dll', '')
      plugins.push({
        name,
        enabled: enabledPlugins.includes(name),
        hasConfig: false
      })
    }
  } catch {
    // No plugins directory
  }

  // Check for plugin configs
  const cfgDir = join(config.dataPath, 'cfg')
  try {
    const cfgEntries = await readdir(cfgDir)
    for (const plugin of plugins) {
      const cfgFile = `plugin_${plugin.name.toLowerCase()}_cfg.yml`
      plugin.hasConfig = cfgEntries.some(e => e.toLowerCase() === cfgFile)
    }
  } catch {
    // No config directory
  }

  return plugins
})
