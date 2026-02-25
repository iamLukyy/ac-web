export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)

  // Weather can be changed at runtime via server config
  const cfg = await readServerConfig()

  if (body.sunAngle !== undefined) {
    cfg.SERVER.SUN_ANGLE = String(body.sunAngle)
  }

  if (body.ambientTemp !== undefined) {
    cfg.WEATHER_0 = cfg.WEATHER_0 || {}
    cfg.WEATHER_0.BASE_TEMPERATURE_AMBIENT = String(body.ambientTemp)
  }

  if (body.roadTemp !== undefined) {
    cfg.WEATHER_0 = cfg.WEATHER_0 || {}
    cfg.WEATHER_0.BASE_TEMPERATURE_ROAD = String(body.roadTemp)
  }

  // Build GRAPHICS field with optional WeatherFX params
  if (body.graphics !== undefined) {
    cfg.WEATHER_0 = cfg.WEATHER_0 || {}
    let graphics = body.graphics as string

    // Strip any existing WeatherFX params from base graphic
    graphics = graphics.replace(/_type=\d+/g, '').replace(/_start=\d+/g, '').replace(/_time=\d+/g, '').replace(/_mult=[\d.]+/g, '')

    // Append WeatherFX time/date/multiplier params if provided
    if (body.wfxTimeOfDay !== undefined && body.wfxTimeOfDay !== null) {
      // timeOfDay is seconds since midnight (e.g. 54000 = 15:00)
      graphics += `_time=${Math.round(body.wfxTimeOfDay)}`
    }
    if (body.wfxDate !== undefined && body.wfxDate !== null) {
      // date as Unix timestamp
      graphics += `_start=${Math.round(body.wfxDate)}`
    }
    if (body.wfxTimeMult !== undefined && body.wfxTimeMult !== null && body.wfxTimeMult !== 1) {
      graphics += `_mult=${body.wfxTimeMult}`
    }

    cfg.WEATHER_0.GRAPHICS = graphics
  }

  if (body.windSpeed !== undefined) {
    cfg.WEATHER_0 = cfg.WEATHER_0 || {}
    cfg.WEATHER_0.WIND_BASE_SPEED_MIN = String(body.windSpeed)
    cfg.WEATHER_0.WIND_BASE_SPEED_MAX = String(body.windSpeed + 5)
  }

  if (body.windDirection !== undefined) {
    cfg.WEATHER_0 = cfg.WEATHER_0 || {}
    cfg.WEATHER_0.WIND_BASE_DIRECTION = String(body.windDirection)
    cfg.WEATHER_0.WIND_VARIATION_DIRECTION = String(body.windVariation || 30)
  }

  if (body.trackGrip !== undefined) {
    cfg.DYNAMIC_TRACK = cfg.DYNAMIC_TRACK || {}
    cfg.DYNAMIC_TRACK.SESSION_START = String(body.trackGrip)
  }

  await writeServerConfig(cfg)

  // Weather changes require restart
  if (getQuery(event).restart !== 'false') {
    await restartServer()
  }

  return { ok: true }
})
