export function useAuth() {
  const authenticated = useState<boolean>('auth', () => false)
  const loading = useState<boolean>('auth-loading', () => true)

  // IMPORTANT: Capture request headers synchronously at composable creation time.
  // useRequestHeaders must be called in the synchronous setup context — if called
  // inside an async function, the Nuxt request context may be lost after an await.
  const ssrHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  async function check() {
    try {
      const data = await $fetch<{ authenticated: boolean }>('/api/auth/check', {
        ...(ssrHeaders ? { headers: ssrHeaders } : {})
      })
      authenticated.value = data.authenticated
    } catch {
      authenticated.value = false
    } finally {
      loading.value = false
    }
  }

  async function login(password: string) {
    const data = await $fetch<{ ok: boolean }>('/api/auth', {
      method: 'POST',
      body: { password }
    })
    if (data.ok) {
      authenticated.value = true
    }
    return data.ok
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    authenticated.value = false
    navigateTo('/admin/login')
  }

  return { authenticated, loading, check, login, logout }
}
