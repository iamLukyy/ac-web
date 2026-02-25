export default defineNuxtRouteMiddleware(async () => {
  const { authenticated, check } = useAuth()

  // Always check session on server/fresh load
  await check()

  if (!authenticated.value) {
    return navigateTo('/admin/login')
  }
})
