<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const toast = useToast()

const { data: tracks, refresh: refreshTracks } = useFetch<any[]>('/api/tracks', { server: false, lazy: true })
const { data: active, refresh: refreshActive } = useFetch<{ track: string; layout: string }>('/api/tracks/active', { server: false, lazy: true })
const { data: serverCfg } = useFetch<any>('/api/config/server', { server: false, lazy: true })

const selectedTrack = ref('')
const selectedLayout = ref('')
const saving = ref(false)

// Weather controls
const sunAngle = ref(16)
const ambientTemp = ref(22)
const roadTemp = ref(8)
const trackGrip = ref(96)
const weatherGraphic = ref('3_clear')
const windSpeed = ref(0)
const windDirection = ref(0)
const windVariation = ref(30)
const savingWeather = ref(false)

// WeatherFX time/date controls
const wfxEnabled = ref(false)
const wfxTimeHour = ref(12)
const wfxTimeMinute = ref(0)
const wfxDateEnabled = ref(false)
const wfxMonth = ref(6)
const wfxDay = ref(15)
const wfxTimeMult = ref(1)

// Extended weather options for WeatherFX (CSP)
const weatherOptions = [
  { label: 'Clear', value: '3_clear' },
  { label: 'Mid Clear', value: '4_mid_clear' },
  { label: 'Few Clouds', value: '5_light_clouds' },
  { label: 'Scattered Clouds', value: '6_mid_clouds' },
  { label: 'Broken Clouds', value: '7_heavy_clouds' },
  { label: 'Overcast', value: '8_overcast' },
  { label: 'Light Fog', value: '2_light_fog' },
  { label: 'Heavy Fog', value: '1_heavy_fog' },
  { label: 'Mist', value: '2_mist' },
  { label: 'Haze', value: '2_haze' },
  { label: 'Light Rain', value: '9_rain' },
  { label: 'Heavy Rain', value: '10_heavy_rain' },
  { label: 'Thunderstorm', value: '11_thunderstorm' },
  { label: 'Drizzle', value: '9_drizzle' },
  { label: 'Light Snow', value: '12_snow' },
  { label: 'Heavy Snow', value: '13_heavy_snow' },
  { label: 'Sleet', value: '14_sleet' },
  { label: 'Windy', value: '3_windy' },
]

const months = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

// Helper: parse WeatherFX params from GRAPHICS string
function parseWeatherFxGraphics(graphics: string) {
  const result: { base: string; time?: number; start?: number; mult?: number } = { base: graphics }

  const timeMatch = graphics.match(/_time=(\d+)/)
  if (timeMatch) result.time = parseInt(timeMatch[1])

  const startMatch = graphics.match(/_start=(\d+)/)
  if (startMatch) result.start = parseInt(startMatch[1])

  const multMatch = graphics.match(/_mult=([\d.]+)/)
  if (multMatch) result.mult = parseFloat(multMatch[1])

  // Base graphic is everything before the first WeatherFX param
  result.base = graphics
    .replace(/_type=\d+/g, '')
    .replace(/_start=\d+/g, '')
    .replace(/_time=\d+/g, '')
    .replace(/_mult=[\d.]+/g, '')

  return result
}

// Track preview URLs
const activePreviewUrl = computed(() => {
  if (!active.value?.track) return ''
  const base = `/api/tracks/${active.value.track}/preview`
  return active.value.layout ? `${base}?layout=${active.value.layout}` : base
})

const selectedPreviewUrl = computed(() => {
  if (!selectedTrack.value) return ''
  const base = `/api/tracks/${selectedTrack.value}/preview`
  return selectedLayout.value ? `${base}?layout=${selectedLayout.value}` : base
})

// Computed display
const timeDisplay = computed(() => {
  const h = String(wfxTimeHour.value).padStart(2, '0')
  const m = String(wfxTimeMinute.value).padStart(2, '0')
  return `${h}:${m}`
})

const seasonLabel = computed(() => {
  const m = wfxMonth.value
  if (m >= 3 && m <= 5) return 'Spring'
  if (m >= 6 && m <= 8) return 'Summer'
  if (m >= 9 && m <= 11) return 'Autumn'
  return 'Winter'
})

// Sync active track to selection
watch(active, (val) => {
  if (val) {
    selectedTrack.value = val.track
    selectedLayout.value = val.layout
  }
}, { immediate: true })

// Sync weather from server config
watch(serverCfg, (cfg) => {
  if (!cfg) return
  sunAngle.value = parseInt(cfg.SERVER?.SUN_ANGLE) || 16

  if (cfg.WEATHER_0) {
    ambientTemp.value = parseInt(cfg.WEATHER_0.BASE_TEMPERATURE_AMBIENT) || 22
    roadTemp.value = parseInt(cfg.WEATHER_0.BASE_TEMPERATURE_ROAD) || 8
    windSpeed.value = parseInt(cfg.WEATHER_0.WIND_BASE_SPEED_MIN) || 0
    windDirection.value = parseInt(cfg.WEATHER_0.WIND_BASE_DIRECTION) || 0
    windVariation.value = parseInt(cfg.WEATHER_0.WIND_VARIATION_DIRECTION) || 30

    // Parse GRAPHICS with WeatherFX params
    const raw = cfg.WEATHER_0.GRAPHICS || '3_clear'
    const parsed = parseWeatherFxGraphics(raw)
    weatherGraphic.value = parsed.base

    if (parsed.time !== undefined) {
      wfxEnabled.value = true
      wfxTimeHour.value = Math.floor(parsed.time / 3600)
      wfxTimeMinute.value = Math.floor((parsed.time % 3600) / 60)
    }

    if (parsed.start !== undefined) {
      wfxDateEnabled.value = true
      const d = new Date(parsed.start * 1000)
      wfxMonth.value = d.getUTCMonth() + 1
      wfxDay.value = d.getUTCDate()
    }

    if (parsed.mult !== undefined) {
      wfxTimeMult.value = parsed.mult
    }
  }

  if (cfg.DYNAMIC_TRACK) {
    trackGrip.value = parseInt(cfg.DYNAMIC_TRACK.SESSION_START) || 96
  }
}, { immediate: true })

const trackItems = computed(() => {
  return (tracks.value || []).map(t => t.id)
})

const layoutItems = computed(() => {
  const track = tracks.value?.find(t => t.id === selectedTrack.value)
  return track?.layouts || []
})

async function changeTrack() {
  saving.value = true
  try {
    await $fetch('/api/tracks/active', {
      method: 'PUT',
      body: { track: selectedTrack.value, layout: selectedLayout.value }
    })
    toast.add({ title: t('track.trackChanged'), color: 'success' })
    refreshActive()
  } catch {
    toast.add({ title: t('track.trackChangeFailed'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function updateWeather() {
  savingWeather.value = true
  try {
    const payload: any = {
      sunAngle: sunAngle.value,
      ambientTemp: ambientTemp.value,
      roadTemp: roadTemp.value,
      trackGrip: trackGrip.value,
      graphics: weatherGraphic.value,
      windSpeed: windSpeed.value,
      windDirection: windDirection.value,
      windVariation: windVariation.value,
    }

    // WeatherFX time of day
    if (wfxEnabled.value) {
      payload.wfxTimeOfDay = wfxTimeHour.value * 3600 + wfxTimeMinute.value * 60
    }

    // WeatherFX date (season)
    if (wfxDateEnabled.value) {
      // Use 2024 as a non-leap year baseline, UTC
      const d = new Date(Date.UTC(2024, wfxMonth.value - 1, wfxDay.value, 12, 0, 0))
      payload.wfxDate = Math.floor(d.getTime() / 1000)
    }

    // Time multiplier
    if (wfxTimeMult.value !== 1) {
      payload.wfxTimeMult = wfxTimeMult.value
    }

    await $fetch('/api/weather', { method: 'PUT', body: payload })
    toast.add({ title: t('track.weatherUpdated'), color: 'success' })
  } catch {
    toast.add({ title: t('track.weatherFailed'), color: 'error' })
  } finally {
    savingWeather.value = false
  }
}

// File upload
const uploading = ref(false)
async function uploadTrack(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', input.files[0])

  try {
    await $fetch('/api/tracks/upload', { method: 'POST', body: formData })
    toast.add({ title: t('track.trackUploaded'), color: 'success' })
    refreshTracks()
  } catch {
    toast.add({ title: t('track.uploadFailed'), color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('track.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Current Track -->
        <div class="relative overflow-hidden rounded-lg border border-(--ui-border)">
          <img
            :src="activePreviewUrl"
            :alt="active?.track"
            class="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          <div class="relative z-10 p-6 space-y-4">
            <h3 class="font-semibold text-white text-lg drop-shadow">{{ t('track.activeTrack') }}</h3>

            <div class="text-sm">
              <span class="text-white/70">{{ t('track.current') }}</span>
              <span class="ml-2 font-semibold text-white drop-shadow">{{ active?.track }}</span>
              <span v-if="active?.layout" class="text-white/70 ml-1">/ {{ active.layout }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField :label="t('track.track')">
                <USelect v-model="selectedTrack" :items="trackItems" :placeholder="t('track.selectTrack')" class="w-full" />
              </UFormField>

              <UFormField v-if="layoutItems.length" :label="t('track.layout')">
                <USelect v-model="selectedLayout" :items="layoutItems" :placeholder="t('track.selectLayout')" class="w-full" />
              </UFormField>
            </div>

            <!-- Selected track preview (when different from active) -->
            <div
              v-if="selectedTrack && selectedTrack !== active?.track"
              class="relative overflow-hidden rounded-lg h-32"
            >
              <img
                :src="selectedPreviewUrl"
                :alt="selectedTrack"
                class="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div class="relative z-10 h-full flex items-end p-3">
                <p class="text-sm font-medium text-white drop-shadow">{{ selectedTrack }} <span v-if="selectedLayout" class="text-white/70">/ {{ selectedLayout }}</span></p>
              </div>
            </div>

            <UButton
              :label="t('track.changeTrackRestart')"
              icon="i-lucide-save"
              :loading="saving"
              @click="changeTrack"
            />
          </div>
        </div>

        <!-- Weather Controls -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('track.weather') }}</h3>
          </template>

          <div class="space-y-4">
            <UFormField :label="t('track.weatherType')">
              <USelect v-model="weatherGraphic" :items="weatherOptions" value-key="value" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField :label="t('track.sunAngle') + ': ' + sunAngle + '°'" :description="t('track.sunAngleDesc')">
                <USlider v-model="sunAngle" :min="-80" :max="80" />
              </UFormField>

              <UFormField :label="t('track.trackGrip') + ': ' + trackGrip + '%'" :description="t('track.trackGripDesc')">
                <USlider v-model="trackGrip" :min="80" :max="100" />
              </UFormField>

              <UFormField :label="t('track.ambientTemp') + ': ' + ambientTemp + '°C'">
                <USlider v-model="ambientTemp" :min="-10" :max="45" />
              </UFormField>

              <UFormField :label="t('track.roadTempOffset') + ': ' + roadTemp + '°C'">
                <USlider v-model="roadTemp" :min="-10" :max="30" />
              </UFormField>

              <UFormField :label="t('track.windSpeed') + ': ' + windSpeed + ' km/h'">
                <USlider v-model="windSpeed" :min="0" :max="40" />
              </UFormField>

              <UFormField :label="t('track.windDirection') + ': ' + windDirection + '°'">
                <USlider v-model="windDirection" :min="0" :max="360" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- WeatherFX Time & Season (CSP) -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ t('track.wfxTitle') }}</h3>
              <UBadge :label="t('track.requiresCsp')" color="violet" variant="subtle" />
            </div>
          </template>

          <div class="space-y-5">
            <UAlert
              :title="t('track.cspWeatherFx')"
              :description="t('track.cspWeatherFxDesc')"
              color="info"
              variant="subtle"
              icon="i-lucide-info"
            />

            <!-- Time of Day -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USwitch v-model="wfxEnabled" />
                <span class="font-medium text-sm">{{ t('track.customTimeOfDay') }}</span>
                <UBadge v-if="wfxEnabled" :label="timeDisplay" color="violet" variant="subtle" />
              </div>

              <div v-if="wfxEnabled" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                <UFormField :label="t('track.hour') + ': ' + wfxTimeHour">
                  <USlider v-model="wfxTimeHour" :min="0" :max="23" />
                </UFormField>
                <UFormField :label="t('track.minute') + ': ' + String(wfxTimeMinute).padStart(2, '0')">
                  <USlider v-model="wfxTimeMinute" :min="0" :max="59" :step="5" />
                </UFormField>
              </div>
            </div>

            <!-- Date / Season -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USwitch v-model="wfxDateEnabled" />
                <span class="font-medium text-sm">{{ t('track.customDateSeason') }}</span>
                <UBadge v-if="wfxDateEnabled" :label="seasonLabel" :color="wfxMonth >= 6 && wfxMonth <= 8 ? 'warning' : wfxMonth >= 3 && wfxMonth <= 5 ? 'success' : wfxMonth >= 9 && wfxMonth <= 11 ? 'orange' : 'info'" variant="subtle" />
              </div>

              <div v-if="wfxDateEnabled" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                <UFormField :label="t('track.month')">
                  <USelect v-model="wfxMonth" :items="months" value-key="value" class="w-full" />
                </UFormField>
                <UFormField :label="t('track.day') + ': ' + wfxDay">
                  <USlider v-model="wfxDay" :min="1" :max="28" />
                </UFormField>
              </div>

              <p v-if="wfxDateEnabled" class="text-xs text-(--ui-text-muted) pl-10">
                {{ t('track.seasonNote') }}
              </p>
            </div>

            <!-- Time Multiplier -->
            <div class="space-y-3">
              <UFormField :label="t('track.timeSpeed') + ': ' + wfxTimeMult + 'x'" :description="t('track.timeSpeedDesc')">
                <USlider v-model="wfxTimeMult" :min="0" :max="60" :step="0.5" />
              </UFormField>
            </div>

            <UButton
              :label="t('track.applyWeatherRestart')"
              icon="i-lucide-cloud-sun"
              color="warning"
              :loading="savingWeather"
              @click="updateWeather"
            />
          </div>
        </UCard>

        <!-- Upload Track -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('track.uploadTrack') }}</h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-(--ui-text-muted)">{{ t('track.uploadTrackDesc') }}</p>
            <UButton
              :label="t('track.chooseFile')"
              icon="i-lucide-upload"
              color="neutral"
              variant="outline"
              :loading="uploading"
              @click="($refs.trackFileInput as HTMLInputElement).click()"
            />
            <input ref="trackFileInput" type="file" accept=".zip,.tar.gz,.tgz" class="hidden" @change="uploadTrack" />
            <UBadge v-if="uploading" color="warning" :label="t('track.uploading')" variant="subtle" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
