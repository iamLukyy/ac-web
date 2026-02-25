<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const toast = useToast()
const { data: templates, refresh } = useFetch('/api/templates', { server: false, lazy: true })
const { data: info } = useFetch('/api/server/info', { server: false, lazy: true })

const applying = ref<string | null>(null)

// Determine which template is currently active by matching track
const activeTemplateId = computed(() => {
  if (!info.value || !templates.value) return null
  return templates.value.find((t: any) => t.track === info.value.track)?.id || null
})

async function applyTemplate(id: string, name: string) {
  applying.value = id
  try {
    await $fetch(`/api/templates/${id}`, { method: 'POST' })
    toast.add({ title: t('templates.title') + ' "' + name + '" ' + t('templates.applied'), description: t('templates.serverRestarting'), color: 'success' })
    // Wait for server to come back
    setTimeout(() => {
      refresh()
      applying.value = null
    }, 5000)
  } catch (e: any) {
    toast.add({ title: t('templates.applyError'), description: e.message, color: 'error' })
    applying.value = null
  }
}

async function deleteTemplate(id: string) {
  try {
    await $fetch(`/api/templates/${id}`, { method: 'DELETE' })
    toast.add({ title: t('templates.deleted'), color: 'success' })
    refresh()
  } catch (e: any) {
    toast.add({ title: t('templates.deleteError'), description: e.message, color: 'error' })
  }
}

// Car display name helper
function carDisplayName(carId: string): string {
  return carId
    .replace(/^vdc_/, '')
    .replace(/^rl_/, '')
    .replace(/^smp_/, '')
    .replace(/^acmc_/, '')
    .replace(/_public$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('templates.title')">
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
        <p class="text-sm text-(--ui-text-muted)">
          {{ t('templates.description') }}
        </p>

        <!-- Template Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="template in (templates || [])"
            :key="template.id"
            class="relative overflow-hidden rounded-lg border transition-all"
            :class="activeTemplateId === template.id ? 'ring-2 ring-violet-500 border-violet-500/50' : 'border-(--ui-border) hover:border-(--ui-border-hover)'"
          >
            <!-- Track preview background -->
            <img
              :src="`/api/tracks/${template.track}/preview${template.layout ? '?layout=' + template.layout : ''}`"
              :alt="template.track"
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />

            <div class="relative z-10 p-5 space-y-4">
              <!-- Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon :name="template.icon || 'i-lucide-bookmark'" class="size-6 text-violet-400" />
                  <div>
                    <h3 class="font-semibold text-lg text-white drop-shadow">{{ template.name }}</h3>
                    <UBadge
                      v-if="activeTemplateId === template.id"
                      :label="t('templates.active')"
                      color="success"
                      size="xs"
                      class="mt-1"
                    />
                  </div>
                </div>
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="deleteTemplate(template.id)"
                />
              </div>

              <!-- Info -->
              <div class="space-y-3 text-sm">
                <p class="text-white/70">{{ template.description }}</p>

                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-map" class="size-4 text-white/60" />
                  <span class="font-medium text-white drop-shadow">{{ template.track }}{{ template.layout ? ` / ${template.layout}` : '' }}</span>
                </div>

                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-lucide-car" class="size-4 text-white/60" />
                    <span class="font-medium text-white drop-shadow">{{ [...new Set(template.cars)].length }} {{ t('templates.carsIncluded') }} ({{ template.cars.length }} slots)</span>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="car in [...new Set(template.cars)]"
                      :key="car"
                      :label="carDisplayName(car)"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    />
                  </div>
                </div>

                <div class="flex gap-4 text-xs text-white/50">
                  <span>ABS: {{ template.absAllowed ? 'On' : 'Off' }}</span>
                  <span>TC: {{ template.tcAllowed ? 'On' : 'Off' }}</span>
                </div>
              </div>

              <!-- Apply button -->
              <UButton
                :label="activeTemplateId === template.id ? t('templates.active') : t('templates.apply')"
                :icon="activeTemplateId === template.id ? 'i-lucide-check' : 'i-lucide-play'"
                :color="activeTemplateId === template.id ? 'success' : 'primary'"
                :disabled="activeTemplateId === template.id || applying !== null"
                :loading="applying === template.id"
                block
                @click="applyTemplate(template.id, template.name)"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <UCard v-if="!templates?.length">
          <div class="text-center py-8">
            <UIcon name="i-lucide-bookmark-x" class="size-12 mx-auto text-(--ui-text-muted) mb-3" />
            <p class="font-medium">No templates yet</p>
            <p class="text-sm text-(--ui-text-muted)">Create templates from the current server configuration.</p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>