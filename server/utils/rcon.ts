import { Socket } from 'node:net'

// Source RCON protocol implementation
const SERVERDATA_AUTH = 3
const SERVERDATA_AUTH_RESPONSE = 2
const SERVERDATA_EXECCOMMAND = 2
const SERVERDATA_RESPONSE_VALUE = 0

function buildPacket(id: number, type: number, body: string): Buffer {
  const bodyBuf = Buffer.from(body, 'utf-8')
  const size = 4 + 4 + bodyBuf.length + 2 // id + type + body + 2 null terminators
  const buf = Buffer.alloc(4 + size)
  buf.writeInt32LE(size, 0)
  buf.writeInt32LE(id, 4)
  buf.writeInt32LE(type, 8)
  bodyBuf.copy(buf, 12)
  buf.writeInt8(0, 12 + bodyBuf.length)
  buf.writeInt8(0, 13 + bodyBuf.length)
  return buf
}

function parsePacket(buf: Buffer): { size: number; id: number; type: number; body: string } {
  // Wire format: [4 bytes size][4 bytes id][4 bytes type][body][2 null bytes]
  // size = number of bytes after the size field (id + type + body + 2 nulls)
  const size = buf.readInt32LE(0)
  const id = buf.readInt32LE(4)
  const type = buf.readInt32LE(8)
  // Body starts at offset 12, ends at (4 + size - 2) to exclude the 2 null terminators
  const body = buf.subarray(12, 4 + size - 2).toString('utf-8')
  return { size, id, type, body }
}

export async function rconCommand(command: string): Promise<string> {
  const config = useRuntimeConfig()
  const password = config.rconPassword
  const port = 8082
  const host = '127.0.0.1'

  return new Promise((resolve, reject) => {
    const socket = new Socket()
    let responseBody = ''
    let authenticated = false
    let buffer = Buffer.alloc(0)
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error('RCON timeout'))
    }, 5000)

    socket.connect(port, host, () => {
      // Send auth packet
      socket.write(buildPacket(1, SERVERDATA_AUTH, password))
    })

    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data])

      while (buffer.length >= 4) {
        const packetSize = buffer.readInt32LE(0) + 4
        if (buffer.length < packetSize) break

        const packet = parsePacket(buffer.subarray(0, packetSize))
        buffer = buffer.subarray(packetSize)

        if (!authenticated) {
          if (packet.type === SERVERDATA_AUTH_RESPONSE) {
            if (packet.id === -1) {
              clearTimeout(timeout)
              socket.destroy()
              reject(new Error('RCON auth failed'))
              return
            }
            authenticated = true
            // Send command
            socket.write(buildPacket(2, SERVERDATA_EXECCOMMAND, command))
          }
        } else {
          if (packet.type === SERVERDATA_RESPONSE_VALUE) {
            responseBody += packet.body
            clearTimeout(timeout)
            socket.destroy()
            resolve(responseBody)
          }
        }
      }
    })

    socket.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}
