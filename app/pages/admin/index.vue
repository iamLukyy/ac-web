<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { data: status, refresh: refreshStatus } = useFetch('/api/server/status', { server: false, lazy: true })
const { data: info } = useFetch('/api/server/info', { server: false, lazy: true })

const restarting = ref(false)
const { t } = useI18n()

async function restart() {
  restarting.value = true
  try {
    await $fetch('/api/server/restart', { method: 'POST' })
    // Wait a moment then refresh
    setTimeout(() => {
      refreshStatus()
      restarting.value = false
    }, 3000)
  } catch {
    restarting.value = false
  }
}

// Auto-refresh every 10 seconds (client-only)
let refreshInterval: ReturnType<typeof setInterval>
onMounted(() => { refreshInterval = setInterval(() => refreshStatus(), 10000) })
onUnmounted(() => clearInterval(refreshInterval))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('dashboard.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UColorModeButton />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Status Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <div class="flex items-center gap-3">
              <UIcon
                :name="status?.running ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                :class="status?.running ? 'text-green-500' : 'text-red-500'"
                class="size-8"
              />
              <div>
                <p class="text-sm text-(--ui-text-muted)">{{ t('dashboard.server') }}</p>
                <p class="font-semibold">{{ status?.running ? t('dashboard.online') : t('dashboard.offline') }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-users" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">{{ t('dashboard.players') }}</p>
                <p class="font-semibold">{{ info?.clients ?? 0 }} / {{ info?.maxclients ?? 0 }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-map" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">{{ t('dashboard.track') }}</p>
                <p class="font-semibold truncate">{{ info?.track ?? '—' }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-car" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">{{ t('dashboard.cars') }}</p>
                <p class="font-semibold">{{ info?.cars?.length ?? 0 }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('dashboard.quickActions') }}</h3>
          </template>

          <div class="flex flex-wrap gap-3">
            <UButton
              :label="t('dashboard.restartServer')"
              icon="i-lucide-refresh-cw"
              color="warning"
              :loading="restarting"
              @click="restart"
            />
            <UButton
              :label="t('dashboard.serverLogs')"
              icon="i-lucide-terminal"
              color="neutral"
              variant="subtle"
              to="/admin/server"
            />
            <UButton
              :label="t('dashboard.changeTrack')"
              icon="i-lucide-map"
              color="neutral"
              variant="subtle"
              to="/admin/track"
            />
            <UButton
              :label="t('dashboard.manageCars')"
              icon="i-lucide-car"
              color="neutral"
              variant="subtle"
              to="/admin/cars"
            />
            <UButton
              :label="t('dashboard.templates')"
              icon="i-lucide-bookmark"
              color="neutral"
              variant="subtle"
              to="/admin/templates"
            />
          </div>
        </UCard>

        <!-- Server Info -->
        <UCard v-if="info">
          <template #header>
            <h3 class="font-semibold">{{ t('dashboard.serverInfo') }}</h3>
          </template>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-(--ui-text-muted)">{{ t('dashboard.name') }}</span>
              <span class="ml-2 font-medium">{{ info.name }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">{{ t('dashboard.session') }}</span>
              <span class="ml-2 font-medium">{{ info.session }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">{{ t('dashboard.uptime') }}</span>
              <span class="ml-2 font-medium">{{ status?.uptime || '—' }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">{{ t('dashboard.password') }}</span>
              <span class="ml-2 font-medium">{{ info.pass ? t('dashboard.yes') : t('dashboard.no') }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
