export default defineEventHandler(async (event) => {
  requireAuth(event)

  const body = await readBody(event)
  if (!body?.message) {
    throw createError({ statusCode: 400, statusMessage: 'Message is required' })
  }

  const config = useRuntimeConfig()
  const url = `${config.acServerUrl}/api/broadcast`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: body.message,
      duration: body.duration || 10,
      color: body.color || '#FFD700'
    }),
    signal: AbortSignal.timeout(5000)
  })

  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'AC server broadcast failed' })
  }

  return await res.json()
})
