<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const toast = useToast()

const { data: tracks, refresh: refreshTracks } = useFetch<any[]>('/api/tracks')
const { data: active, refresh: refreshActive } = useFetch<{ track: string; layout: string }>('/api/tracks/active')
const { data: serverCfg } = useFetch<any>('/api/config/server')

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
    toast.add({ title: 'Track changed, server restarting...', color: 'success' })
    refreshActive()
  } catch {
    toast.add({ title: 'Failed to change track', color: 'error' })
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
    toast.add({ title: 'Weather updated, server restarting...', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update weather', color: 'error' })
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
    toast.add({ title: 'Track uploaded', color: 'success' })
    refreshTracks()
  } catch {
    toast.add({ title: 'Upload failed', color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Track & Weather">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Current Track -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Active Track</h3>
          </template>

          <div class="space-y-4">
            <div class="text-sm">
              <span class="text-(--ui-text-muted)">Current:</span>
              <span class="ml-2 font-medium">{{ active?.track }}</span>
              <span v-if="active?.layout" class="text-(--ui-text-muted) ml-1">/ {{ active.layout }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Track">
                <USelect v-model="selectedTrack" :items="trackItems" placeholder="Select track" class="w-full" />
              </UFormField>

              <UFormField v-if="layoutItems.length" label="Layout">
                <USelect v-model="selectedLayout" :items="layoutItems" placeholder="Select layout" class="w-full" />
              </UFormField>
            </div>

            <UButton
              label="Change Track & Restart"
              icon="i-lucide-save"
              :loading="saving"
              @click="changeTrack"
            />
          </div>
        </UCard>

        <!-- Weather Controls -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Weather & Environment</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Weather Type">
              <USelect v-model="weatherGraphic" :items="weatherOptions" value-key="value" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField :label="`Sun Angle: ${sunAngle}°`" description="-80 (night) to 80 (high noon)">
                <input type="range" v-model.number="sunAngle" min="-80" max="80" class="w-full" />
              </UFormField>

              <UFormField :label="`Track Grip: ${trackGrip}%`" description="80-100%">
                <input type="range" v-model.number="trackGrip" min="80" max="100" class="w-full" />
              </UFormField>

              <UFormField :label="`Ambient Temp: ${ambientTemp}°C`">
                <input type="range" v-model.number="ambientTemp" min="-10" max="45" class="w-full" />
              </UFormField>

              <UFormField :label="`Road Temp Offset: ${roadTemp}°C`">
                <input type="range" v-model.number="roadTemp" min="-10" max="30" class="w-full" />
              </UFormField>

              <UFormField :label="`Wind Speed: ${windSpeed} km/h`">
                <input type="range" v-model.number="windSpeed" min="0" max="40" class="w-full" />
              </UFormField>

              <UFormField :label="`Wind Direction: ${windDirection}°`">
                <input type="range" v-model.number="windDirection" min="0" max="360" class="w-full" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- WeatherFX Time & Season (CSP) -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">WeatherFX — Time & Season</h3>
              <UBadge label="Requires CSP" color="violet" variant="subtle" />
            </div>
          </template>

          <div class="space-y-5">
            <UAlert
              title="CSP WeatherFX"
              description="These settings control the Custom Shaders Patch weather system. Players need CSP installed for time-of-day, seasons, and advanced weather to work."
              color="info"
              variant="subtle"
              icon="i-lucide-info"
            />

            <!-- Time of Day -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USwitch v-model="wfxEnabled" />
                <span class="font-medium text-sm">Custom Time of Day</span>
                <UBadge v-if="wfxEnabled" :label="timeDisplay" color="violet" variant="subtle" />
              </div>

              <div v-if="wfxEnabled" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                <UFormField :label="`Hour: ${wfxTimeHour}`">
                  <input type="range" v-model.number="wfxTimeHour" min="0" max="23" class="w-full" />
                </UFormField>
                <UFormField :label="`Minute: ${String(wfxTimeMinute).padStart(2, '0')}`">
                  <input type="range" v-model.number="wfxTimeMinute" min="0" max="59" step="5" class="w-full" />
                </UFormField>
              </div>
            </div>

            <!-- Date / Season -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USwitch v-model="wfxDateEnabled" />
                <span class="font-medium text-sm">Custom Date / Season</span>
                <UBadge v-if="wfxDateEnabled" :label="seasonLabel" :color="wfxMonth >= 6 && wfxMonth <= 8 ? 'warning' : wfxMonth >= 3 && wfxMonth <= 5 ? 'success' : wfxMonth >= 9 && wfxMonth <= 11 ? 'orange' : 'info'" variant="subtle" />
              </div>

              <div v-if="wfxDateEnabled" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                <UFormField label="Month">
                  <USelect v-model="wfxMonth" :items="months" value-key="value" class="w-full" />
                </UFormField>
                <UFormField :label="`Day: ${wfxDay}`">
                  <input type="range" v-model.number="wfxDay" min="1" max="28" class="w-full" />
                </UFormField>
              </div>

              <p v-if="wfxDateEnabled" class="text-xs text-(--ui-text-muted) pl-10">
                The date controls the season — sun position, day length, sky color. Winter months = short days, low sun. Summer = long days, high sun.
              </p>
            </div>

            <!-- Time Multiplier -->
            <div class="space-y-3">
              <UFormField :label="`Time Speed: ${wfxTimeMult}x`" description="1x = real-time, 0 = frozen, 60 = 1 hour per minute">
                <input type="range" v-model.number="wfxTimeMult" min="0" max="60" step="0.5" class="w-full" />
              </UFormField>
            </div>

            <UButton
              label="Apply Weather & Restart"
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
            <h3 class="font-semibold">Upload Track</h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-(--ui-text-muted)">Upload a .zip or .tar.gz archive containing a track folder.</p>
            <input type="file" accept=".zip,.tar.gz,.tgz" @change="uploadTrack" :disabled="uploading" class="text-sm" />
            <UBadge v-if="uploading" color="warning" label="Uploading..." variant="subtle" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
