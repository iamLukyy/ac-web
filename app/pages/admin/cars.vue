<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const toast = useToast()
const { data: allCars, refresh: refreshCars } = useFetch<any[]>('/api/cars')
const { data: activeCars, refresh: refreshActive } = useFetch<{ cars: string[]; entries: any[] }>('/api/cars/active')

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
    toast.add({ title: `Saved ${selectedCars.value.length} cars, server restarting...`, color: 'success' })
    refreshActive()
  } catch {
    toast.add({ title: 'Failed to save cars', color: 'error' })
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
    toast.add({ title: 'Car uploaded', color: 'success' })
    refreshCars()
  } catch {
    toast.add({ title: 'Upload failed', color: 'error' })
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
      <UDashboardNavbar title="Cars">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UBadge
            :label="`${selectedCars.length} selected`"
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
            label="Save & Restart"
            icon="i-lucide-save"
            :loading="saving"
            @click="saveCars"
          />
          <UButton label="Select All" color="neutral" variant="subtle" @click="selectAll" />
          <UButton label="Deselect All" color="neutral" variant="subtle" @click="deselectAll" />
        </div>

        <!-- Car Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <UCard
            v-for="car in allCars"
            :key="car.id"
            class="cursor-pointer transition-all"
            :class="selectedCars.includes(car.id) ? 'ring-2 ring-violet-500' : 'opacity-60'"
            @click="toggleCar(car.id)"
          >
            <div class="flex items-center gap-3">
              <UCheckbox :model-value="selectedCars.includes(car.id)" @click.stop />
              <div class="min-w-0">
                <p class="font-medium truncate">{{ formatCarName(car.id) }}</p>
                <p class="text-xs text-(--ui-text-muted)">{{ car.skinCount }} skins</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Upload Car -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Upload Car</h3>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-(--ui-text-muted)">Upload a .zip or .tar.gz archive containing a car folder.</p>
            <input type="file" accept=".zip,.tar.gz,.tgz" @change="uploadCar" :disabled="uploading" />
            <UBadge v-if="uploading" color="warning" label="Uploading..." variant="subtle" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
