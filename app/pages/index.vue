<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { data: serverInfo, refresh } = useFetch('/api/server/info')

// Auto-refresh every 10 seconds
const refreshInterval = setInterval(() => refresh(), 10000)
onUnmounted(() => clearInterval(refreshInterval))

const isOnline = computed(() => !!serverInfo.value)
const playerCount = computed(() => serverInfo.value?.clients ?? 0)
const maxPlayers = computed(() => serverInfo.value?.maxclients ?? 0)
const trackName = computed(() => formatTrackName(serverInfo.value?.track || ''))
const sessionName = computed(() => serverInfo.value?.session ?? '')
const cars = computed(() => {
  const carList = serverInfo.value?.cars || []
  return carList.map((c: any) => formatCarName(typeof c === 'string' ? c : c.Model || c.model || ''))
})

function formatCarName(id: string): string {
  let name = id.replace(/^(ks_|vdc_)/, '').replace(/_public(_|$)/g, '$1')
    .replace(/_drift$/, ' Drift').replace(/_tuned$/, ' Tuned')

  return name.split('_').map((w: string) => {
    if (/^(bmw|gtr?|hgk|evo|jzx\d+)$/i.test(w)) return w.toUpperCase()
    if (/^mk[iv]+$/i.test(w)) return w.toUpperCase()
    if (/^[a-z]+\d/i.test(w)) return w.toUpperCase()
    if (/^\d/.test(w)) return w.toUpperCase()
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')
    .replace(/RX(\d)/g, 'RX-$1')
    .replace(/GT(\s?)R\b/g, 'GT-R')
    .replace(/Supersnake/, 'Super Snake')
    .replace(/Markii/, 'Mark II')
    .replace(/ DRIFT$/, ' Drift')
    .replace(/ TUNED$/, ' Tuned')
}

function formatTrackName(id: string): string {
  return id.replace(/^(ks_|vdc_|\d+_)/, '')
    .split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const connectUrl = 'https://acstuff.club/s/q:race/online/join?ip=152.53.2.219&httpPort=8081'
</script>

<template>
  <div class="min-h-screen bg-(--ui-bg)">
    <!-- Header -->
    <header class="border-b border-(--ui-border)">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-gauge" class="size-7 text-violet-500" />
          <span class="font-bold text-xl">AC Web</span>
        </div>

        <div class="flex items-center gap-3">
          <UBadge
            :color="isOnline ? 'success' : 'error'"
            :label="isOnline ? 'Online' : 'Offline'"
            variant="subtle"
            size="lg"
          />
          <UColorModeButton />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <!-- Hero -->
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-bold">AC Web</h1>
        <p class="text-lg text-(--ui-text-muted)">Assetto Corsa server dashboard</p>

        <UButton
          :to="connectUrl"
          target="_blank"
          label="Connect via Content Manager"
          icon="i-lucide-play"
          size="xl"
          :disabled="!isOnline"
        />
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold">{{ playerCount }}/{{ maxPlayers }}</p>
            <p class="text-sm text-(--ui-text-muted)">Players</p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold truncate">{{ sessionName || '—' }}</p>
            <p class="text-sm text-(--ui-text-muted)">Session</p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold truncate">{{ trackName || '—' }}</p>
            <p class="text-sm text-(--ui-text-muted)">Track</p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold">{{ cars.length }}</p>
            <p class="text-sm text-(--ui-text-muted)">Cars</p>
          </div>
        </UCard>
      </div>

      <!-- Car List -->
      <UCard v-if="cars.length">
        <template #header>
          <h2 class="font-semibold">Available Cars</h2>
        </template>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div
            v-for="car in cars"
            :key="car"
            class="px-3 py-2 bg-(--ui-bg-muted) rounded-lg text-sm"
          >
            {{ car }}
          </div>
        </div>
      </UCard>

      <!-- Server Info -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Server Info</h2>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-(--ui-text-muted)">IP:</span>
            <code class="ml-2">152.53.2.219:9600</code>
          </div>
          <div>
            <span class="text-(--ui-text-muted)">HTTP Port:</span>
            <code class="ml-2">8081</code>
          </div>
          <div>
            <span class="text-(--ui-text-muted)">Password:</span>
            <span class="ml-2">None (open server)</span>
          </div>
          <div>
            <span class="text-(--ui-text-muted)">Website:</span>
            <a href="https://ac.karel.app" class="ml-2 text-violet-500 hover:underline">ac.karel.app</a>
          </div>
        </div>
      </UCard>
    </main>

    <!-- Footer -->
    <footer class="border-t border-(--ui-border) mt-12">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-(--ui-text-muted)">
        <span>AC Web Server</span>
        <NuxtLink to="/admin/login" class="hover:text-(--ui-text) transition-colors">
          Admin
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
