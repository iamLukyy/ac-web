<script setup lang="ts">
const { logout } = useAuth()
const { t, toggleLocale, localeName } = useI18n()

const navigation = computed(() => [
  {
    label: t("nav.dashboard"),
    icon: "i-lucide-layout-dashboard",
    to: "/admin"
  },
  {
    label: t("nav.templates"),
    icon: "i-lucide-bookmark",
    to: "/admin/templates"
  },
  {
    label: t("nav.server"),
    icon: "i-lucide-server",
    to: "/admin/server"
  },
  {
    label: t("nav.track"),
    icon: "i-lucide-map",
    to: "/admin/track"
  },
  {
    label: t("nav.cars"),
    icon: "i-lucide-car",
    to: "/admin/cars"
  },
  {
    label: t("nav.content"),
    icon: "i-lucide-download",
    to: "/admin/content"
  },
  {
    label: t("nav.plugins"),
    icon: "i-lucide-puzzle",
    to: "/admin/plugins"
  },
  {
    label: t("nav.broadcast"),
    icon: "i-lucide-megaphone",
    to: "/admin/broadcast"
  },
  {
    label: t("nav.players"),
    icon: "i-lucide-users",
    to: "/admin/players"
  }
])

const footerNavigation = computed(() => [
  {
    label: localeName.value,
    icon: "i-lucide-languages",
    onClick: toggleLocale
  },
  {
    label: t("nav.backToSite"),
    icon: "i-lucide-external-link",
    to: "/"
  },
  {
    label: t("nav.logout"),
    icon: "i-lucide-log-out",
    onClick: logout
  }
])
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

      <template #footer>
        <UNavigationMenu :items="footerNavigation" orientation="vertical" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
