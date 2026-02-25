export default defineNuxtRouteMiddleware(async () => {
  const { authenticated, loading, check } = useAuth()

  if (loading.value) {
    await check()
  }

  if (!authenticated.value) {
    return navigateTo('/admin/login')
  }
})
