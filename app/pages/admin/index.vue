<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { data: status, refresh: refreshStatus } = useFetch('/api/server/status')
const { data: info } = useFetch('/api/server/info')

const restarting = ref(false)

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

// Auto-refresh every 10 seconds
const refreshInterval = setInterval(() => refreshStatus(), 10000)
onUnmounted(() => clearInterval(refreshInterval))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Dashboard">
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
                <p class="text-sm text-(--ui-text-muted)">Server</p>
                <p class="font-semibold">{{ status?.running ? 'Online' : 'Offline' }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-users" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">Players</p>
                <p class="font-semibold">{{ info?.clients ?? 0 }} / {{ info?.maxclients ?? 0 }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-map" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">Track</p>
                <p class="font-semibold truncate">{{ info?.track ?? '—' }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-car" class="size-8 text-violet-500" />
              <div>
                <p class="text-sm text-(--ui-text-muted)">Cars</p>
                <p class="font-semibold">{{ info?.cars?.length ?? 0 }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Quick Actions</h3>
          </template>

          <div class="flex flex-wrap gap-3">
            <UButton
              label="Restart Server"
              icon="i-lucide-refresh-cw"
              color="warning"
              :loading="restarting"
              @click="restart"
            />
            <UButton
              label="Server Logs"
              icon="i-lucide-terminal"
              color="neutral"
              variant="subtle"
              to="/admin/server"
            />
            <UButton
              label="Change Track"
              icon="i-lucide-map"
              color="neutral"
              variant="subtle"
              to="/admin/track"
            />
            <UButton
              label="Manage Cars"
              icon="i-lucide-car"
              color="neutral"
              variant="subtle"
              to="/admin/cars"
            />
          </div>
        </UCard>

        <!-- Server Info -->
        <UCard v-if="info">
          <template #header>
            <h3 class="font-semibold">Server Info</h3>
          </template>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-(--ui-text-muted)">Name:</span>
              <span class="ml-2 font-medium">{{ info.name }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">Session:</span>
              <span class="ml-2 font-medium">{{ info.session }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">Uptime:</span>
              <span class="ml-2 font-medium">{{ status?.uptime || '—' }}</span>
            </div>
            <div>
              <span class="text-(--ui-text-muted)">Password:</span>
              <span class="ml-2 font-medium">{{ info.pass ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
