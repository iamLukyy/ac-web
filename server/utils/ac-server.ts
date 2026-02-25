const config = useRuntimeConfig()

export async function fetchACServer(path: string): Promise<any> {
  const url = `${config.acServerUrl}${path}`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(`AC server responded ${response.status}`)
    return await response.json()
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `AC server unavailable: ${err.message}`
    })
  }
}

export async function getServerInfo(): Promise<any> {
  return fetchACServer('/INFO')
}

export async function getServerDetails(): Promise<any> {
  return fetchACServer('/api/details')
}
