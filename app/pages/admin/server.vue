<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const toast = useToast()

// Server status
const { data: status, refresh: refreshStatus } = useFetch('/api/server/status')
const restarting = ref(false)

// Config data
const { data: serverCfg, refresh: refreshServerCfg } = useFetch<any>('/api/config/server')
const { data: extraCfg, refresh: refreshExtraCfg } = useFetch<any>('/api/config/extra')

// Form fields — synced from config
const serverName = ref('')
const serverDescription = ref('')
const serverPassword = ref('')
const adminPassword = ref('')
const maxClients = ref(27)
const registerToLobby = ref(true)
const loopMode = ref(true)
const absAllowed = ref(true)
const tcAllowed = ref(true)
const stabilityAllowed = ref(false)
const damageMultiplier = ref(50)
const fuelRate = ref(100)
const tyreWearRate = ref(100)

// Extra cfg fields
const minimumCSPVersion = ref(2144)
const useSteamAuth = ref(true)
const enableServerDetails = ref(true)
const enableCarReset = ref(true)
const forceLights = ref(false)
const enableWeatherFx = ref(true)

const savingServer = ref(false)
const savingExtra = ref(false)

// Sync config to form
watch(serverCfg, (cfg) => {
  if (!cfg?.SERVER) return
  serverName.value = cfg.SERVER.NAME || ''
  serverPassword.value = cfg.SERVER.PASSWORD || ''
  adminPassword.value = cfg.SERVER.ADMIN_PASSWORD || ''
  maxClients.value = parseInt(cfg.SERVER.MAX_CLIENTS) || 27
  registerToLobby.value = cfg.SERVER.REGISTER_TO_LOBBY === '1'
  loopMode.value = cfg.SERVER.LOOP_MODE === '1'
  absAllowed.value = cfg.SERVER.ABS_ALLOWED === '1'
  tcAllowed.value = cfg.SERVER.TC_ALLOWED === '1'
  stabilityAllowed.value = cfg.SERVER.STABILITY_ALLOWED === '1'
  damageMultiplier.value = parseInt(cfg.SERVER.DAMAGE_MULTIPLIER) || 50
  fuelRate.value = parseInt(cfg.SERVER.FUEL_RATE) || 100
  tyreWearRate.value = parseInt(cfg.SERVER.TYRE_WEAR_RATE) || 100
}, { immediate: true })

watch(extraCfg, (cfg) => {
  if (!cfg) return
  serverDescription.value = cfg.ServerDescription || ''
  minimumCSPVersion.value = cfg.MinimumCSPVersion || 2144
  useSteamAuth.value = cfg.UseSteamAuth !== false
  enableServerDetails.value = cfg.EnableServerDetails !== false
  enableCarReset.value = cfg.EnableCarReset !== false
  forceLights.value = cfg.ForceLights === true
  enableWeatherFx.value = cfg.EnableWeatherFx !== false
}, { immediate: true })

// Save server_cfg.ini
async function saveServerConfig(andRestart = false) {
  savingServer.value = true
  try {
    const cfg = { ...serverCfg.value }
    cfg.SERVER = { ...cfg.SERVER }
    cfg.SERVER.NAME = serverName.value
    cfg.SERVER.PASSWORD = serverPassword.value
    cfg.SERVER.ADMIN_PASSWORD = adminPassword.value
    cfg.SERVER.MAX_CLIENTS = String(maxClients.value)
    cfg.SERVER.REGISTER_TO_LOBBY = registerToLobby.value ? '1' : '0'
    cfg.SERVER.LOOP_MODE = loopMode.value ? '1' : '0'
    cfg.SERVER.ABS_ALLOWED = absAllowed.value ? '1' : '0'
    cfg.SERVER.TC_ALLOWED = tcAllowed.value ? '1' : '0'
    cfg.SERVER.STABILITY_ALLOWED = stabilityAllowed.value ? '1' : '0'
    cfg.SERVER.DAMAGE_MULTIPLIER = String(damageMultiplier.value)
    cfg.SERVER.FUEL_RATE = String(fuelRate.value)
    cfg.SERVER.TYRE_WEAR_RATE = String(tyreWearRate.value)

    await $fetch(`/api/config/server?restart=${andRestart}`, {
      method: 'PUT',
      body: cfg
    })
    toast.add({ title: andRestart ? 'Saved & restarting...' : 'Saved', color: 'success' })
    refreshServerCfg()
    if (andRestart) setTimeout(() => refreshStatus(), 5000)
  } catch (e: any) {
    toast.add({ title: 'Error saving', description: e.message, color: 'error' })
  } finally {
    savingServer.value = false
  }
}

// Save extra_cfg.yml
async function saveExtraConfig(andRestart = false) {
  savingExtra.value = true
  try {
    const cfg = { ...extraCfg.value }
    cfg.ServerDescription = serverDescription.value
    cfg.MinimumCSPVersion = minimumCSPVersion.value
    cfg.UseSteamAuth = useSteamAuth.value
    cfg.EnableServerDetails = enableServerDetails.value
    cfg.EnableCarReset = enableCarReset.value
    cfg.ForceLights = forceLights.value
    cfg.EnableWeatherFx = enableWeatherFx.value

    await $fetch(`/api/config/extra?restart=${andRestart}`, {
      method: 'PUT',
      body: cfg
    })
    toast.add({ title: andRestart ? 'Saved & restarting...' : 'Saved', color: 'success' })
    refreshExtraCfg()
    if (andRestart) setTimeout(() => refreshStatus(), 5000)
  } catch (e: any) {
    toast.add({ title: 'Error saving', description: e.message, color: 'error' })
  } finally {
    savingExtra.value = false
  }
}

// Restart
async function restart() {
  restarting.value = true
  try {
    await $fetch('/api/server/restart', { method: 'POST' })
    toast.add({ title: 'Restarting server...', color: 'warning' })
    setTimeout(() => {
      refreshStatus()
      restarting.value = false
    }, 5000)
  } catch {
    restarting.value = false
    toast.add({ title: 'Restart failed', color: 'error' })
  }
}

// Logs
const logs = ref<string[]>([])
const logContainer = ref<HTMLElement>()
const streaming = ref(false)
let eventSource: EventSource | null = null

function startLogStream() {
  if (eventSource) eventSource.close()
  logs.value = []
  streaming.value = true

  eventSource = new EventSource('/api/server/logs')
  eventSource.onmessage = (e) => {
    const line = JSON.parse(e.data)
    logs.value.push(line)
    if (logs.value.length > 500) logs.value.shift()
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
  eventSource.onerror = () => {
    streaming.value = false
  }
}

function stopLogStream() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  streaming.value = false
}

// BBCode to HTML preview
const bbcodePreview = computed(() => {
  let text = serverDescription.value || ''
  // Escape HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // BBCode transforms
  text = text.replace(/\[b\](.*?)\[\/b\]/gs, '<strong>$1</strong>')
  text = text.replace(/\[i\](.*?)\[\/i\]/gs, '<em>$1</em>')
  text = text.replace(/\[u\](.*?)\[\/u\]/gs, '<u>$1</u>')
  text = text.replace(/\[size=(\d+)\](.*?)\[\/size\]/gs, '<span style="font-size:$1px">$2</span>')
  text = text.replace(/\[color=(#?\w+)\](.*?)\[\/color\]/gs, '<span style="color:$1">$2</span>')
  text = text.replace(/\[url=(.*?)\](.*?)\[\/url\]/gs, '<a href="$1" class="text-violet-500 underline" target="_blank">$2</a>')
  text = text.replace(/\[url\](.*?)\[\/url\]/gs, '<a href="$1" class="text-violet-500 underline" target="_blank">$1</a>')
  text = text.replace(/\\n/g, '<br>')
  text = text.replace(/\n/g, '<br>')
  return text
})

onMounted(() => startLogStream())
onUnmounted(() => stopLogStream())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Server">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UBadge
            :color="status?.running ? 'success' : 'error'"
            :label="status?.running ? 'Online' : 'Offline'"
            variant="subtle"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Controls -->
        <div class="flex flex-wrap gap-3">
          <UButton
            label="Restart Server"
            icon="i-lucide-refresh-cw"
            color="warning"
            :loading="restarting"
            @click="restart"
          />
          <UButton
            v-if="!streaming"
            label="Start Log Stream"
            icon="i-lucide-play"
            color="neutral"
            variant="subtle"
            @click="startLogStream"
          />
          <UButton
            v-else
            label="Stop Log Stream"
            icon="i-lucide-square"
            color="neutral"
            variant="subtle"
            @click="stopLogStream"
          />
        </div>

        <div v-if="status?.uptime" class="text-sm text-(--ui-text-muted)">
          Uptime: {{ status.uptime }}
        </div>

        <!-- Server Settings (server_cfg.ini) -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Server Settings</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Server Name" description="Displayed in AC server browser and Content Manager">
              <UInput v-model="serverName" class="w-full" placeholder="My Server | example.com" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Server Password" description="Leave empty for open server">
                <UInput v-model="serverPassword" class="w-full" placeholder="(no password)" />
              </UFormField>

              <UFormField label="Admin Password" description="For in-game admin commands">
                <UInput v-model="adminPassword" type="password" class="w-full" />
              </UFormField>
            </div>

            <UFormField :label="`Max Clients: ${maxClients}`">
              <input type="range" v-model.number="maxClients" min="1" max="64" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div class="flex items-center gap-2">
                <USwitch v-model="registerToLobby" />
                <span class="text-sm">Show in lobby</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="loopMode" />
                <span class="text-sm">Loop mode</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="absAllowed" />
                <span class="text-sm">ABS allowed</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="tcAllowed" />
                <span class="text-sm">TC allowed</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="stabilityAllowed" />
                <span class="text-sm">Stability allowed</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormField :label="`Damage: ${damageMultiplier}%`">
                <input type="range" v-model.number="damageMultiplier" min="0" max="100" class="w-full" />
              </UFormField>
              <UFormField :label="`Fuel Rate: ${fuelRate}%`">
                <input type="range" v-model.number="fuelRate" min="0" max="200" class="w-full" />
              </UFormField>
              <UFormField :label="`Tyre Wear: ${tyreWearRate}%`">
                <input type="range" v-model.number="tyreWearRate" min="0" max="200" class="w-full" />
              </UFormField>
            </div>

            <div class="flex gap-2">
              <UButton
                label="Save"
                icon="i-lucide-save"
                :loading="savingServer"
                @click="saveServerConfig(false)"
              />
              <UButton
                label="Save & Restart"
                icon="i-lucide-refresh-cw"
                color="warning"
                :loading="savingServer"
                @click="saveServerConfig(true)"
              />
            </div>
          </div>
        </UCard>

        <!-- Server Description (extra_cfg.yml) with BBCode -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Server Description & Extra Config</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Server Description (BBCode)" description="Shown in Content Manager. Use BBCode: [b]bold[/b], [i]italic[/i], [url=...]link[/url], [size=18]text[/size], [color=#ff0000]text[/color]">
              <UTextarea
                v-model="serverDescription"
                :rows="6"
                class="w-full font-mono"
                placeholder="[b][size=18]Server Name[/size][/b]&#10;&#10;[url=https://example.com]Website[/url]"
              />
            </UFormField>

            <!-- BBCode preview -->
            <div class="bg-(--ui-bg-muted) rounded-lg p-4">
              <p class="text-xs text-(--ui-text-muted) mb-2">Preview (approximate):</p>
              <div class="text-sm" v-html="bbcodePreview"></div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <UFormField label="Min CSP Version">
                <UInput v-model.number="minimumCSPVersion" type="number" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div class="flex items-center gap-2">
                <USwitch v-model="useSteamAuth" />
                <span class="text-sm">Steam Auth</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="enableServerDetails" />
                <span class="text-sm">Server Details</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="enableCarReset" />
                <span class="text-sm">Car Reset</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="forceLights" />
                <span class="text-sm">Force Lights</span>
              </div>
              <div class="flex items-center gap-2">
                <USwitch v-model="enableWeatherFx" />
                <span class="text-sm">WeatherFX</span>
              </div>
            </div>

            <div class="flex gap-2">
              <UButton
                label="Save"
                icon="i-lucide-save"
                :loading="savingExtra"
                @click="saveExtraConfig(false)"
              />
              <UButton
                label="Save & Restart"
                icon="i-lucide-refresh-cw"
                color="warning"
                :loading="savingExtra"
                @click="saveExtraConfig(true)"
              />
            </div>
          </div>
        </UCard>

        <!-- Log Viewer -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Live Logs</h3>
              <UBadge v-if="streaming" color="success" label="Streaming" variant="subtle" />
            </div>
          </template>

          <div
            ref="logContainer"
            class="h-[500px] overflow-y-auto font-mono text-xs bg-(--ui-bg) rounded-lg p-4 space-y-0.5"
          >
            <div v-if="logs.length === 0" class="text-(--ui-text-muted)">
              Waiting for log data...
            </div>
            <div
              v-for="(line, i) in logs"
              :key="i"
              class="whitespace-pre-wrap break-all leading-relaxed"
              :class="{
                'text-red-400': line.includes('Error') || line.includes('ERROR'),
                'text-yellow-400': line.includes('Warning') || line.includes('WARN'),
                'text-green-400': line.includes('connected') || line.includes('Connected')
              }"
            >
              {{ line }}
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

