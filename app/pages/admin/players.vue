<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const toast = useToast()

const { data: players, refresh: refreshPlayers } = useFetch<any[]>('/api/players')
const { data: whitelist, refresh: refreshWhitelist } = useFetch<string[]>('/api/players/whitelist')
const { data: blacklist, refresh: refreshBlacklist } = useFetch<string[]>('/api/players/blacklist')
const { data: admins, refresh: refreshAdmins } = useFetch<string[]>('/api/players/admins')

const newGuid = ref('')
const kicking = ref<string | null>(null)
const banning = ref<string | null>(null)

const tabItems = [
  { label: 'Online', icon: 'i-lucide-wifi', slot: 'online' as const },
  { label: 'Whitelist', icon: 'i-lucide-shield-check', slot: 'whitelist' as const },
  { label: 'Blacklist', icon: 'i-lucide-ban', slot: 'blacklist' as const },
  { label: 'Admins', icon: 'i-lucide-crown', slot: 'admins' as const }
]

async function kickPlayer(guid: string) {
  kicking.value = guid
  try {
    await $fetch(`/api/players/${guid}/kick`, { method: 'POST' })
    toast.add({ title: 'Player kicked', color: 'success' })
    setTimeout(() => refreshPlayers(), 1000)
  } catch {
    toast.add({ title: 'Kick failed', color: 'error' })
  } finally {
    kicking.value = null
  }
}

async function banPlayer(guid: string) {
  banning.value = guid
  try {
    await $fetch(`/api/players/${guid}/ban`, { method: 'POST' })
    toast.add({ title: 'Player banned', color: 'success' })
    refreshBlacklist()
  } catch {
    toast.add({ title: 'Ban failed', color: 'error' })
  } finally {
    banning.value = null
  }
}

async function addToList(listType: 'whitelist' | 'blacklist' | 'admins') {
  if (!newGuid.value.trim()) return

  const current = listType === 'whitelist' ? whitelist.value
    : listType === 'blacklist' ? blacklist.value
      : admins.value

  const items = [...(current || []), newGuid.value.trim()]

  try {
    await $fetch(`/api/players/${listType}`, {
      method: 'PUT',
      body: { items }
    })
    toast.add({ title: `Added to ${listType}`, color: 'success' })
    newGuid.value = ''
    if (listType === 'whitelist') refreshWhitelist()
    else if (listType === 'blacklist') refreshBlacklist()
    else refreshAdmins()
  } catch {
    toast.add({ title: 'Failed to add', color: 'error' })
  }
}

async function removeFromList(listType: 'whitelist' | 'blacklist' | 'admins', guid: string) {
  const current = listType === 'whitelist' ? whitelist.value
    : listType === 'blacklist' ? blacklist.value
      : admins.value

  const items = (current || []).filter(g => g !== guid)

  try {
    await $fetch(`/api/players/${listType}`, {
      method: 'PUT',
      body: { items }
    })
    toast.add({ title: `Removed from ${listType}`, color: 'success' })
    if (listType === 'whitelist') refreshWhitelist()
    else if (listType === 'blacklist') refreshBlacklist()
    else refreshAdmins()
  } catch {
    toast.add({ title: 'Failed to remove', color: 'error' })
  }
}

// Auto-refresh online players
const refreshInterval = setInterval(() => refreshPlayers(), 10000)
onUnmounted(() => clearInterval(refreshInterval))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Players">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
        <template #right>
          <UBadge :label="`${players?.length || 0} online`" color="neutral" variant="subtle" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UTabs :items="tabItems" class="w-full">
          <!-- Online Players Tab -->
          <template #online>
            <div class="pt-4 space-y-2">
              <div v-if="!players?.length" class="text-(--ui-text-muted) text-center py-8">
                No players online
              </div>

              <UCard v-for="player in players" :key="player.guid">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ player.name }}</p>
                    <p class="text-xs text-(--ui-text-muted)">{{ player.car }} &middot; {{ player.guid }}</p>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      label="Kick"
                      icon="i-lucide-user-x"
                      size="xs"
                      color="warning"
                      variant="subtle"
                      :loading="kicking === player.guid"
                      @click="kickPlayer(player.guid)"
                    />
                    <UButton
                      label="Ban"
                      icon="i-lucide-ban"
                      size="xs"
                      color="error"
                      variant="subtle"
                      :loading="banning === player.guid"
                      @click="banPlayer(player.guid)"
                    />
                  </div>
                </div>
              </UCard>
            </div>
          </template>

          <!-- Whitelist Tab -->
          <template #whitelist>
            <div class="pt-4 space-y-4">
              <div class="flex gap-2">
                <UInput v-model="newGuid" placeholder="Steam GUID (e.g. 76561198...)" class="flex-1" />
                <UButton label="Add" icon="i-lucide-plus" @click="addToList('whitelist')" />
              </div>

              <div v-if="!whitelist?.length" class="text-(--ui-text-muted) text-center py-8">
                Whitelist is empty
              </div>

              <UCard v-for="guid in whitelist" :key="guid">
                <div class="flex items-center justify-between">
                  <code class="text-sm">{{ guid }}</code>
                  <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="removeFromList('whitelist', guid)" />
                </div>
              </UCard>
            </div>
          </template>

          <!-- Blacklist Tab -->
          <template #blacklist>
            <div class="pt-4 space-y-4">
              <div class="flex gap-2">
                <UInput v-model="newGuid" placeholder="Steam GUID (e.g. 76561198...)" class="flex-1" />
                <UButton label="Add" icon="i-lucide-plus" @click="addToList('blacklist')" />
              </div>

              <div v-if="!blacklist?.length" class="text-(--ui-text-muted) text-center py-8">
                Blacklist is empty
              </div>

              <UCard v-for="guid in blacklist" :key="guid">
                <div class="flex items-center justify-between">
                  <code class="text-sm">{{ guid }}</code>
                  <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="removeFromList('blacklist', guid)" />
                </div>
              </UCard>
            </div>
          </template>

          <!-- Admins Tab -->
          <template #admins>
            <div class="pt-4 space-y-4">
              <div class="flex gap-2">
                <UInput v-model="newGuid" placeholder="Steam GUID (e.g. 76561198...)" class="flex-1" />
                <UButton label="Add" icon="i-lucide-plus" @click="addToList('admins')" />
              </div>

              <div v-if="!admins?.length" class="text-(--ui-text-muted) text-center py-8">
                No admins configured
              </div>

              <UCard v-for="guid in admins" :key="guid">
                <div class="flex items-center justify-between">
                  <code class="text-sm">{{ guid }}</code>
                  <UButton icon="i-lucide-trash-2" size="xs" color="error" variant="ghost" @click="removeFromList('admins', guid)" />
                </div>
              </UCard>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
