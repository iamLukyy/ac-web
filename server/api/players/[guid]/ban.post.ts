export default defineEventHandler(async (event) => {
  requireAuth(event)

  const guid = getRouterParam(event, 'guid')
  if (!guid) throw createError({ statusCode: 400, statusMessage: 'GUID required' })

  // Add to blacklist
  const blacklist = await readTextList('blacklist.txt')
  if (!blacklist.includes(guid)) {
    blacklist.push(guid)
    await writeTextList('blacklist.txt', blacklist)
  }

  return { ok: true }
})
