export function useAuth() {
  const authenticated = useState<boolean>('auth', () => false)
  const loading = useState<boolean>('auth-loading', () => true)

  async function check() {
    try {
      const data = await $fetch<{ authenticated: boolean }>('/api/auth/check')
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
