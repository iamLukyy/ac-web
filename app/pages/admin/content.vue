<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const { data: extraCfg, error, refresh } = useFetch<Record<string, any>>('/api/config/extra')

const contentEnabled = computed(() => {
  if (!extraCfg.value) return false
  const cfg = extraCfg.value.CMContentConfiguration
  return !!cfg && (cfg.Cars === true || cfg.Tracks === true)
})

const carsEnabled = computed(() => {
  return !!extraCfg.value?.CMContentConfiguration?.Cars
})

const tracksEnabled = computed(() => {
  return !!extraCfg.value?.CMContentConfiguration?.Tracks
})

const config = useRuntimeConfig()
const serverBaseUrl = 'https://ac.karel.app'
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('content.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #trailing>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UAlert
          color="info"
          icon="i-lucide-info"
          :title="t('content.title')"
          :description="t('content.cmDescription')"
        />

        <UAlert
          v-if="error"
          color="error"
          icon="i-lucide-alert-circle"
          :title="t('content.loadFailed')"
          :description="error.message"
        />

        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('content.status') }}</h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                :name="contentEnabled ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                :class="contentEnabled ? 'text-green-500' : 'text-red-500'"
                class="size-6"
              />
              <span>{{ t('content.contentDownloadsAre') }} {{ contentEnabled ? t('content.enabled') : t('content.notConfigured') }}</span>
            </div>

            <div v-if="contentEnabled" class="flex gap-4 text-sm">
              <span class="flex items-center gap-1.5">
                <UIcon
                  :name="carsEnabled ? 'i-lucide-check' : 'i-lucide-x'"
                  :class="carsEnabled ? 'text-green-500' : 'text-red-400'"
                  class="size-4"
                />
                {{ t('content.cars') }}: {{ carsEnabled ? t('content.enabledLabel') : t('content.disabledLabel') }}
              </span>
              <span class="flex items-center gap-1.5">
                <UIcon
                  :name="tracksEnabled ? 'i-lucide-check' : 'i-lucide-x'"
                  :class="tracksEnabled ? 'text-green-500' : 'text-red-400'"
                  class="size-4"
                />
                {{ t('content.tracks') }}: {{ tracksEnabled ? t('content.enabledLabel') : t('content.disabledLabel') }}
              </span>
            </div>

            <p class="text-sm text-(--ui-text-muted)">
              {{ t('content.enableNote') }}
            </p>

            <UAlert
              color="warning"
              icon="i-lucide-alert-triangle"
              :title="t('content.filesRequired')"
            />
          </div>
        </UCard>

        <UCard v-if="contentEnabled">
          <template #header>
            <h3 class="font-semibold">{{ t('content.downloadUrls') }}</h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-(--ui-text-muted)">
              {{ t('content.downloadUrlsDesc') }}
            </p>

            <div class="space-y-2 font-mono text-sm">
              <div v-if="carsEnabled" class="space-y-1">
                <p class="text-xs font-sans text-(--ui-text-muted) uppercase tracking-wide">{{ t('content.carModel') }}</p>
                <code class="block bg-(--ui-bg-elevated) px-3 py-2 rounded">/content/car/{model}</code>
              </div>
              <div v-if="carsEnabled" class="space-y-1">
                <p class="text-xs font-sans text-(--ui-text-muted) uppercase tracking-wide">{{ t('content.carSkin') }}</p>
                <code class="block bg-(--ui-bg-elevated) px-3 py-2 rounded">/content/skin/{model}/{skin}</code>
              </div>
              <div v-if="tracksEnabled" class="space-y-1">
                <p class="text-xs font-sans text-(--ui-text-muted) uppercase tracking-wide">{{ t('track.track') }}</p>
                <code class="block bg-(--ui-bg-elevated) px-3 py-2 rounded">/content/track</code>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>