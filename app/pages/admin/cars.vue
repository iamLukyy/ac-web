<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const toast = useToast()
const { data: allCars, refresh: refreshCars } = useFetch<any[]>('/api/cars', { server: false, lazy: true })
const { data: activeCars, refresh: refreshActive } = useFetch<{ cars: string[]; entries: any[] }>('/api/cars/active', { server: false, lazy: true })

const selectedCars = ref<string[]>([])
const saving = ref(false)
const uploading = ref(false)

// Sync active cars to selection
watch(activeCars, (val) => {
  if (val?.cars) {
    selectedCars.value = [...val.cars]
  }
}, { immediate: true })

function toggleCar(carId: string) {
  const idx = selectedCars.value.indexOf(carId)
  if (idx >= 0) {
    selectedCars.value.splice(idx, 1)
  } else {
    selectedCars.value.push(carId)
  }
}

function selectAll() {
  selectedCars.value = (allCars.value || []).map(c => c.id)
}

function deselectAll() {
  selectedCars.value = []
}

async function saveCars() {
  saving.value = true
  try {
    await $fetch('/api/cars/active', {
      method: 'PUT',
      body: { cars: selectedCars.value }
    })
    toast.add({ title: selectedCars.value.length + ' ' + t('cars.savedRestarting'), color: 'success' })
    refreshActive()
  } catch {
    toast.add({ title: t('cars.saveFailed'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function uploadCar(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', input.files[0])

  try {
    await $fetch('/api/cars/upload', { method: 'POST', body: formData })
    toast.add({ title: t('cars.carUploaded'), color: 'success' })
    refreshCars()
  } catch {
    toast.add({ title: t('cars.uploadFailed'), color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function formatCarName(id: string): string {
  let name = id.replace(/^(ks_|vdc_)/, '').replace(/_public(_|$)/g, '$1')
    .replace(/_drift$/, ' Drift').replace(/_tuned$/, ' Tuned')

  return name.split('_').map(w => {
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('cars.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UBadge
            :label="selectedCars.length + ' ' + t('cars.selected')"
            color="neutral"
            variant="subtle"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Controls -->
        <div class="flex flex-wrap gap-3">
          <UButton
            :label="t('cars.saveRestart')"
            icon="i-lucide-save"
            :loading="saving"
            @click="saveCars"
          />
          <UButton :label="t('cars.selectAll')" color="neutral" variant="subtle" @click="selectAll" />
          <UButton :label="t('cars.deselectAll')" color="neutral" variant="subtle" @click="deselectAll" />
        </div>

        <!-- Car Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="car in allCars"
            :key="car.id"
            class="relative overflow-hidden rounded-lg cursor-pointer transition-all border border-(--ui-border) hover:border-(--ui-border-hover)"
            :class="selectedCars.includes(car.id) ? 'ring-2 ring-violet-500' : 'opacity-60'"
            @click="toggleCar(car.id)"
          >
            <img
              :src="`/api/cars/${car.id}/preview`"
              :alt="car.id"
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div class="relative z-10 p-4 pt-16 flex items-end gap-3">
              <UCheckbox :model-value="selectedCars.includes(car.id)" @click.stop />
              <div class="min-w-0">
                <p class="font-medium truncate text-white drop-shadow">{{ formatCarName(car.id) }}</p>
                <p class="text-xs text-white/70">{{ car.skinCount + ' ' + t('cars.skins') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Car -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('cars.uploadCar') }}</h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-(--ui-text-muted)">{{ t('cars.uploadCarDesc') }}</p>
            <UButton
              :label="t('cars.chooseFile')"
              icon="i-lucide-upload"
              color="neutral"
              variant="outline"
              :loading="uploading"
              @click="($refs.carFileInput as HTMLInputElement).click()"
            />
            <input ref="carFileInput" type="file" accept=".zip,.tar.gz,.tgz" class="hidden" @change="uploadCar" />
            <UBadge v-if="uploading" color="warning" :label="t('cars.uploading')" variant="subtle" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
