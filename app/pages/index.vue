<script setup lang="ts">
definePageMeta({
  layout: false
})

const { data: serverInfo, refresh } = useFetch('/api/server/info')

// Auto-refresh every 10s (client-only)
let refreshInterval: ReturnType<typeof setInterval>
onMounted(() => { refreshInterval = setInterval(() => refresh(), 10000) })
onUnmounted(() => clearInterval(refreshInterval))

const isOnline = computed(() => !!serverInfo.value)
const playerCount = computed(() => serverInfo.value?.clients ?? 0)
const maxPlayers = computed(() => serverInfo.value?.maxclients ?? 0)

// Parse server name — extract the theme name (first segment before |)
const serverTheme = computed(() => {
  const name = serverInfo.value?.name || ''
  const parts = name.split('|').map((s: string) => s.trim())
  return parts[0] || 'Drift Dev'
})

// Dynamic page title
useHead({
  title: computed(() => serverTheme.value ? `${serverTheme.value} — ac.karel.app` : 'Drift Dev — ac.karel.app')
})

// Parse track field: "g333_goodwood_hillclimb-layout_a" → { id, layout }
const trackInfo = computed(() => {
  const raw = serverInfo.value?.track || ''
  const dashIdx = raw.indexOf('-')
  if (dashIdx === -1) return { id: raw, layout: '' }
  return { id: raw.slice(0, dashIdx), layout: raw.slice(dashIdx + 1) }
})

const trackPreviewUrl = computed(() => {
  if (!trackInfo.value.id) return ''
  const base = `/api/tracks/${trackInfo.value.id}/preview`
  return trackInfo.value.layout ? `${base}?layout=${trackInfo.value.layout}` : base
})

// Format track name from ID
function formatTrackName(id: string): string {
  return id
    .replace(/^(g333_|ks_|00_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Format layout name
function formatLayoutName(layout: string): string {
  return layout.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Car name parser — strips prefixes, formats nicely
function formatCarName(id: string): string {
  let name = id
    .replace(/^(ks_|vdc_|rl_|smp_|acmc_|zs_|wrc_|fnf2_|2F2F_)/, '')
    .replace(/_public(_|$)/g, '$1')
    .replace(/_drift$/, '')

  return name.split('_').map(w => {
    if (/^(bmw|gtr?|hgk|evo|jzx\d+|wrc|ds3|rs\d+)$/i.test(w)) return w.toUpperCase()
    if (/^mk[iv]+$/i.test(w)) return w.toUpperCase()
    if (/^[a-z]+\d/i.test(w)) return w.toUpperCase()
    if (/^\d/.test(w)) return w.toUpperCase()
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')
    .replace(/RX(\d)/g, 'RX-$1')
    .replace(/GT(\s?)R\b/g, 'GT-R')
}

// Dynamic car list from server info
const cars = computed(() => serverInfo.value?.cars || [])

// Unique cars (deduplicated)
const uniqueCars = computed(() => [...new Set(cars.value)])

// Slots per car
function slotsForCar(carId: string): number {
  return cars.value.filter((c: string) => c === carId).length
}

const connectUrl = 'https://acstuff.club/s/q:race/online/join?ip=152.53.2.219&httpPort=8081'

</script>

<template>
  <div class="landing-page min-h-screen bg-zinc-950 text-white">
    <!-- HERO — Full bleed track preview -->
    <section class="relative min-h-[85vh] flex flex-col justify-end overflow-hidden">
      <!-- Track background -->
      <div class="absolute inset-0">
        <img
          v-if="trackPreviewUrl"
          :src="trackPreviewUrl"
          :alt="trackInfo.id"
          class="w-full h-full object-cover scale-105"
          style="filter: saturate(1.2) contrast(1.1);"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div class="absolute inset-0 bg-zinc-950/40" />
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />
      </div>

      <!-- Top bar -->
      <nav class="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-red-500'" />
          <span class="font-mono text-xs tracking-widest uppercase text-white/70">ac.karel.app</span>
        </div>

        <div class="flex items-center gap-3">
          <div v-if="isOnline" class="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span class="font-mono text-xs text-white/70 tabular-nums">{{ playerCount }}/{{ maxPlayers }}</span>
          </div>
          <div v-else class="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div class="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span class="font-mono text-xs text-white/50">Offline</span>
          </div>
        </div>
      </nav>

      <!-- Hero content -->
      <div class="relative z-10 px-6 pb-16 md:px-12 lg:px-20 max-w-6xl">
        <!-- Theme badge -->
        <div class="mb-6 flex items-center gap-3">
          <div class="h-px w-12 bg-violet-500" />
          <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-400">
            {{ isOnline ? 'Live now' : 'Offline' }}
          </span>
        </div>

        <!-- Server theme name — THE headline -->
        <h1 class="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
          <span class="block text-white">{{ serverTheme }}</span>
        </h1>

        <!-- Track info line -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
          <span class="font-mono text-sm text-white/60 uppercase tracking-wider">
            {{ formatTrackName(trackInfo.id) }}
          </span>
          <span v-if="trackInfo.layout" class="text-white/30">/</span>
          <span v-if="trackInfo.layout" class="font-mono text-sm text-white/60 uppercase tracking-wider">
            {{ formatLayoutName(trackInfo.layout) }}
          </span>
          <span class="text-white/30">&#8212;</span>
          <span class="font-mono text-sm text-white/60">
            {{ uniqueCars.length }} cars &middot; {{ maxPlayers }} slots
          </span>
        </div>

        <!-- CTA -->
        <div class="flex flex-wrap items-center gap-4">
          <a
            :href="connectUrl"
            target="_blank"
            class="group inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 font-bold text-sm uppercase tracking-wider transition-all duration-200"
            :class="{ 'opacity-40 pointer-events-none': !isOnline }"
          >
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
            Join Server
          </a>
          <span class="font-mono text-xs text-white/30 tracking-wider">Content Manager auto-downloads everything</span>
        </div>
      </div>
    </section>

    <!-- CARS GRID -->
    <section class="relative px-6 md:px-12 lg:px-20 py-20 max-w-7xl mx-auto">
      <!-- Section header -->
      <div class="flex items-end justify-between mb-10">
        <div>
          <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-500 block mb-2">Garage</span>
          <h2 class="text-4xl sm:text-5xl font-black uppercase tracking-tight">{{ uniqueCars.length }} Cars</h2>
        </div>
        <span class="font-mono text-xs text-white/30 hidden sm:block">{{ cars.length }} total slots</span>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
        <div
          v-for="(car, idx) in uniqueCars"
          :key="car"
          class="car-card group relative aspect-[4/3] overflow-hidden bg-zinc-900"
        >
          <img
            :src="`/api/cars/${car}/preview`"
            :alt="car"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

          <!-- Car info overlay -->
          <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-10">
            <p class="font-bold text-xs sm:text-sm text-white leading-tight drop-shadow-lg">
              {{ formatCarName(car) }}
            </p>
            <p class="font-mono text-[10px] text-white/40 mt-0.5">
              {{ slotsForCar(car) }} {{ slotsForCar(car) === 1 ? 'slot' : 'slots' }}
            </p>
          </div>

          <!-- Hover accent line -->
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
      </div>
    </section>

    <!-- SERVER DETAILS -->
    <section class="border-t border-white/5 px-6 md:px-12 lg:px-20 py-16">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <!-- Connect -->
          <div>
            <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-500 block mb-4">Connect</span>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex justify-between text-white/70">
                <span class="text-white/40">IP</span>
                <span>152.53.2.219:9600</span>
              </div>
              <div class="flex justify-between text-white/70">
                <span class="text-white/40">HTTP</span>
                <span>8081</span>
              </div>
              <div class="flex justify-between text-white/70">
                <span class="text-white/40">Password</span>
                <span>{{ serverInfo?.pass ? 'Yes' : 'None' }}</span>
              </div>
            </div>
          </div>

          <!-- How to join -->
          <div>
            <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-500 block mb-4">How to join</span>
            <ol class="space-y-2 text-sm text-white/50 list-none">
              <li class="flex gap-3">
                <span class="font-mono text-violet-500/70 shrink-0">01</span>
                <span>Install <strong class="text-white/70">Content Manager</strong></span>
              </li>
              <li class="flex gap-3">
                <span class="font-mono text-violet-500/70 shrink-0">02</span>
                <span>Click <strong class="text-white/70">Join Server</strong> above</span>
              </li>
              <li class="flex gap-3">
                <span class="font-mono text-violet-500/70 shrink-0">03</span>
                <span>Cars &amp; track download automatically</span>
              </li>
              <li class="flex gap-3">
                <span class="font-mono text-violet-500/70 shrink-0">04</span>
                <span>Drive</span>
              </li>
            </ol>
          </div>

          <!-- Status -->
          <div>
            <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-violet-500 block mb-4">Status</span>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-2.5 h-2.5 rounded-full" :class="isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-500'" />
                <span class="font-mono text-sm" :class="isOnline ? 'text-emerald-400' : 'text-red-400'">
                  {{ isOnline ? 'Online' : 'Offline' }}
                </span>
              </div>
              <div class="font-mono text-sm text-white/70">
                <span class="text-3xl font-black text-white tabular-nums">{{ playerCount }}</span>
                <span class="text-white/30 mx-1">/</span>
                <span>{{ maxPlayers }} players</span>
              </div>
              <p class="font-mono text-xs text-white/30">Free Practice &middot; 24/7 &middot; Open</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="border-t border-white/5 px-6 md:px-12 lg:px-20 py-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <span class="font-mono text-[11px] text-white/20 tracking-wider uppercase">Drift Dev</span>
        <NuxtLink to="/admin/login" class="font-mono text-[11px] text-white/20 hover:text-white/50 tracking-wider uppercase transition-colors">
          Admin
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color-scheme: dark;
}

.car-card {
  transition: transform 0.3s ease;
}
</style>
