import { exec } from 'node:child_process'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const config = useRuntimeConfig()

const COMPOSE_DIR = config.dockerComposePath

export async function dockerExec(command: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { cwd: COMPOSE_DIR, timeout: 30000 })
}

export async function getContainerStatus(): Promise<{
  running: boolean
  uptime: string
  memory: string
  cpu: string
}> {
  try {
    const { stdout } = await dockerExec(
      'docker compose ps --format json'
    )

    const lines = stdout.trim().split('\n').filter(Boolean)
    for (const line of lines) {
      const container = JSON.parse(line)
      if (container.Service === 'assettoserver' || container.Name?.includes('ac-server')) {
        return {
          running: container.State === 'running',
          uptime: container.Status || '',
          memory: '',
          cpu: ''
        }
      }
    }

    // Try docker stats for memory/cpu
    return { running: false, uptime: '', memory: '', cpu: '' }
  } catch {
    return { running: false, uptime: '', memory: '', cpu: '' }
  }
}

export async function restartServer(): Promise<void> {
  await dockerExec('docker compose restart')
}

export function streamLogs(onData: (data: string) => void, onError: (err: Error) => void): () => void {
  const proc = spawn('docker', ['compose', 'logs', '-f', '--tail', '100', '--no-log-prefix'], {
    cwd: COMPOSE_DIR
  })

  proc.stdout.on('data', (chunk: Buffer) => onData(chunk.toString()))
  proc.stderr.on('data', (chunk: Buffer) => onData(chunk.toString()))
  proc.on('error', onError)

  return () => {
    proc.kill()
  }
}
