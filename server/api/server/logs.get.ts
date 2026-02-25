export default defineEventHandler(async (event) => {
  requireAuth(event)

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const cleanup = streamLogs(
        (data: string) => {
          try {
            const lines = data.split('\n')
            for (const line of lines) {
              if (line.trim()) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(line)}\n\n`))
              }
            }
          } catch {
            // Stream closed
          }
        },
        (err: Error) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(`[Error: ${err.message}]`)}\n\n`))
          } catch {
            // Stream closed
          }
        }
      )

      // Clean up when client disconnects
      event.node.req.on('close', () => {
        cleanup()
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    }
  })

  return new Response(stream)
})
