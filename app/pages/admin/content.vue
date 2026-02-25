<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { data: extraCfg, refresh } = useFetch<any>('/api/config/extra')

const contentEnabled = computed(() => {
  return !!extraCfg.value?.CMContentConfiguration
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Content Downloads">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UAlert
          color="info"
          icon="i-lucide-info"
          title="Content Manager Downloads"
          description="AssettoServer can serve car and track content to players via Content Manager. This requires CMContentConfiguration in extra_cfg.yml."
        />

        <UCard>
          <template #header>
            <h3 class="font-semibold">Status</h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                :name="contentEnabled ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                :class="contentEnabled ? 'text-green-500' : 'text-red-500'"
                class="size-6"
              />
              <span>Content downloads are {{ contentEnabled ? 'enabled' : 'not configured' }}</span>
            </div>

            <p class="text-sm text-(--ui-text-muted)">
              To enable content downloads, add CMContentConfiguration section to extra_cfg.yml.
              Players using Content Manager will be able to download missing cars and tracks automatically.
            </p>

            <UAlert
              color="warning"
              icon="i-lucide-alert-triangle"
              title="Content files must be present in data/content/ directory for downloads to work."
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
