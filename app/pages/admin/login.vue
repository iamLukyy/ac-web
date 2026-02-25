<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { login, authenticated } = useAuth()
const password = ref('')
const error = ref('')
const loading = ref(false)

// Redirect if already authenticated
watch(authenticated, (val) => {
  if (val) navigateTo('/admin')
}, { immediate: true })

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const ok = await login(password.value)
    if (ok) {
      navigateTo('/admin')
    } else {
      error.value = 'Invalid password'
    }
  } catch {
    error.value = 'Invalid password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-(--ui-bg)">
    <div class="w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <UIcon name="i-lucide-gauge" class="size-12 text-violet-500 mx-auto mb-4" />
        <h1 class="text-2xl font-bold">AC Web Admin</h1>
        <p class="text-sm text-(--ui-text-muted) mt-1">Enter password to access the control panel</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormField label="Password">
          <UInput
            v-model="password"
            type="password"
            placeholder="Enter admin password"
            autofocus
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          icon="i-lucide-alert-circle"
          :title="error"
        />

        <UButton
          type="submit"
          label="Login"
          block
          size="lg"
          :loading="loading"
        />
      </form>
    </div>
  </div>
</template>
