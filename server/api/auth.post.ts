export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  if (!body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Password required' })
  }

  if (body.password !== config.adminPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  createSession(event)

  return { ok: true }
})
