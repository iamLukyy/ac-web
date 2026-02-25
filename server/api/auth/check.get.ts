export default defineEventHandler((event) => {
  return { authenticated: verifySession(event) }
})
