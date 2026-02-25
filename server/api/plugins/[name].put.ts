export default defineEventHandler(async (event) => {
  requireAuth(event)

  const name = getRouterParam(event, 'name')
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Plugin name required' })

  const body = await readBody(event)
  const extraCfg = await readExtraConfig()

  let enabledPlugins: string[] = extraCfg.EnablePlugins || []

  if (body.enabled === true) {
    if (!enabledPlugins.includes(name)) {
      enabledPlugins.push(name)
    }
  } else if (body.enabled === false) {
    enabledPlugins = enabledPlugins.filter((p: string) => p !== name)
  }

  extraCfg.EnablePlugins = enabledPlugins
  await writeExtraConfig(extraCfg)

  // Plugin config update
  if (body.config) {
    const { writeFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const config = useRuntimeConfig()
    const cfgPath = join(config.dataPath, 'cfg', `plugin_${name.toLowerCase()}_cfg.yml`)
    await writeFile(cfgPath, writeYAML(body.config), 'utf-8')
  }

  return { ok: true, restart: true }
})
