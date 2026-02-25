<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { t } = useI18n()
const toast = useToast()

const message = ref('')
const duration = ref(10)
const color = ref('#FFD700')
const sending = ref(false)

const presetColors = [
  { label: 'Gold', value: '#FFD700' },
  { label: 'Red', value: '#FF4444' },
  { label: 'Green', value: '#44FF44' },
  { label: 'Cyan', value: '#00FFFF' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Orange', value: '#FF8800' },
  { label: 'Pink', value: '#FF44FF' },
  { label: 'Violet', value: '#8B5CF6' }
]

const history = ref<{ message: string; color: string; duration: number; time: string }[]>([])

async function sendBroadcast() {
  if (!message.value.trim()) {
    toast.add({ title: t('broadcast.enterMessage'), color: 'warning' })
    return
  }

  sending.value = true
  try {
    await $fetch('/api/broadcast', {
      method: 'POST',
      body: {
        message: message.value,
        duration: duration.value,
        color: color.value
      }
    })
    toast.add({ title: t('broadcast.broadcastSent'), color: 'success' })
    history.value.unshift({
      message: message.value,
      color: color.value,
      duration: duration.value,
      time: new Date().toLocaleTimeString()
    })
    if (history.value.length > 20) history.value.pop()
  } catch (e: any) {
    toast.add({ title: t('broadcast.broadcastFailed'), description: e.data?.message || e.message, color: 'error' })
  } finally {
    sending.value = false
  }
}

function resend(item: typeof history.value[0]) {
  message.value = item.message
  color.value = item.color
  duration.value = item.duration
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('broadcast.title')">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UBadge color="violet" :label="t('broadcast.chatSpam')" variant="subtle" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Send Broadcast -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('broadcast.sendBroadcast') }}</h3>
          </template>

          <div class="space-y-4">
            <UFormField :label="t('broadcast.message')" :description="t('broadcast.messageDesc')">
              <UInput
                v-model="message"
                class="w-full"
                placeholder="TED JEDE MARTIN VS ONDRA"
                size="xl"
                @keyup.enter="sendBroadcast"
              />
            </UFormField>

            <!-- Preview -->
            <div
              class="relative rounded-lg overflow-hidden h-32 flex items-center justify-center"
              style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
            >
              <div class="absolute inset-0 bg-black/50" />
              <p
                v-if="message"
                class="relative text-2xl sm:text-3xl font-bold text-center px-4 drop-shadow-lg"
                :style="{ color: color }"
              >
                {{ message }}
              </p>
              <p v-else class="relative text-sm text-white/40 italic">
                {{ t('broadcast.typeToPreview') }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField :label="t('broadcast.repeatFor') + ': ' + duration + 's (~' + Math.round(duration / 0.3) + ' ' + t('broadcast.messages') + ')'">
                <USlider v-model="duration" :min="1" :max="15" />
              </UFormField>

              <UFormField :label="t('broadcast.color')">
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-for="preset in presetColors"
                    :key="preset.value"
                    class="size-8 rounded-full border-2 transition-transform hover:scale-110"
                    :class="color === preset.value ? 'border-white scale-110' : 'border-transparent'"
                    :style="{ backgroundColor: preset.value }"
                    :title="preset.label"
                    @click="color = preset.value"
                  />
                  <input
                    type="color"
                    v-model="color"
                    class="size-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                  />
                </div>
              </UFormField>
            </div>

            <UButton
              :label="t('broadcast.sendBroadcast')"
              icon="i-lucide-megaphone"
              size="lg"
              :loading="sending"
              :disabled="!message.trim()"
              @click="sendBroadcast"
            />
          </div>
        </UCard>

        <!-- History -->
        <UCard v-if="history.length > 0">
          <template #header>
            <h3 class="font-semibold">{{ t('broadcast.recentBroadcasts') }}</h3>
          </template>

          <div class="space-y-2">
            <div
              v-for="(item, i) in history"
              :key="i"
              class="flex items-center gap-3 p-3 rounded-lg bg-(--ui-bg-muted) hover:bg-(--ui-bg-elevated) transition-colors cursor-pointer"
              @click="resend(item)"
            >
              <div
                class="size-4 rounded-full shrink-0"
                :style="{ backgroundColor: item.color }"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate" :style="{ color: item.color }">{{ item.message }}</p>
                <p class="text-xs text-(--ui-text-muted)">{{ item.duration }}s</p>
              </div>
              <span class="text-xs text-(--ui-text-muted) shrink-0">{{ item.time }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>