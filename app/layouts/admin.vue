<script setup lang="ts">
const { logout } = useAuth()

const navigation = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin'
  },
  {
    label: 'Server',
    icon: 'i-lucide-server',
    to: '/admin/server'
  },
  {
    label: 'Track & Weather',
    icon: 'i-lucide-map',
    to: '/admin/track'
  },
  {
    label: 'Cars',
    icon: 'i-lucide-car',
    to: '/admin/cars'
  },
  {
    label: 'Content Downloads',
    icon: 'i-lucide-download',
    to: '/admin/content'
  },
  {
    label: 'Plugins',
    icon: 'i-lucide-puzzle',
    to: '/admin/plugins'
  },
  {
    label: 'Players',
    icon: 'i-lucide-users',
    to: '/admin/players'
  }
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 truncate">
          <UIcon name="i-lucide-gauge" class="size-6 text-violet-500 shrink-0" />
          <span v-if="!collapsed" class="font-bold text-lg truncate">AC Web</span>
        </div>
      </template>

      <UNavigationMenu :items="navigation" orientation="vertical" />

      <template #footer="{ collapsed }">
        <div class="flex flex-col gap-2">
          <UButton
            :label="collapsed ? undefined : 'Back to site'"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            to="/"
            block
          />
          <UButton
            :label="collapsed ? undefined : 'Logout'"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            block
            @click="logout"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
