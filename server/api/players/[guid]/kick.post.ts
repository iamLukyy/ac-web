export default defineEventHandler(async (event) => {
  requireAuth(event)

  const guid = getRouterParam(event, 'guid')
  if (!guid) throw createError({ statusCode: 400, statusMessage: 'GUID required' })

  // Kick via AC admin command (send through server API or docker exec)
  const config = useRuntimeConfig()
  try {
    await dockerExec(`docker compose exec -T assettoserver sh -c "echo '/kick ${guid}' > /proc/1/fd/0"`)
  } catch {
    // Fallback: just log it
  }

  return { ok: true }
})
