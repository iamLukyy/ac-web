<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const { data: plugins, refresh } = useFetch<any[]>('/api/plugins')
const saving = ref<string | null>(null)

async function togglePlugin(name: string, enabled: boolean) {
  saving.value = name
  try {
    await $fetch(`/api/plugins/${name}`, {
      method: 'PUT',
      body: { enabled: !enabled }
    })
    refresh()
  } finally {
    saving.value = null
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('plugins.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UAlert
          color="warning"
          icon="i-lucide-info"
          :title="t('plugins.restartRequired')"
        />

        <div v-if="!plugins?.length" class="text-(--ui-text-muted) text-center py-8">
          {{ t('plugins.noPlugins') }}
        </div>

        <div class="space-y-3">
          <UCard v-for="plugin in plugins" :key="plugin.name">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{{ plugin.name }}</p>
                <p class="text-xs text-(--ui-text-muted)">
                  {{ plugin.hasConfig ? t('plugins.hasConfig') : t('plugins.noConfig') }}
                </p>
              </div>

              <USwitch
                :model-value="plugin.enabled"
                :loading="saving === plugin.name"
                @update:model-value="togglePlugin(plugin.name, plugin.enabled)"
              />
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
