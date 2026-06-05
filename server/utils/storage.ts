import { Client, type ClientOptions } from 'minio'
import type { Readable } from 'node:stream'

let client: Client | null = null
let bucketReady = false

function normalizeEndpoint(raw: string, rawUseSSL: string) {
  const fallbackUseSSL = String(rawUseSSL) === 'true'

  try {
    const url = new URL(raw)
    return {
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      useSSL: url.protocol === 'https:',
    }
  } catch {
    return {
      endPoint: raw || 'localhost',
      port: undefined,
      useSSL: fallbackUseSSL,
    }
  }
}

function cfg() {
  const rc = useRuntimeConfig()
  const m = rc.minio
  const normalized = normalizeEndpoint(m.endPoint || 'localhost', m.useSSL)
  const configuredPort = String(m.port || '').trim()

  return {
    endPoint: normalized.endPoint,
    port: configuredPort ? Number(configuredPort) : normalized.port,
    useSSL: normalized.useSSL,
    accessKey: m.accessKey || '',
    secretKey: m.secretKey || '',
    bucket: m.bucket || 'intern-memories',
  }
}

export function getMinio() {
  if (client) return client
  const c = cfg()
  const options: ClientOptions = {
    endPoint: c.endPoint,
    useSSL: c.useSSL,
    accessKey: c.accessKey,
    secretKey: c.secretKey,
  }
  if (c.port !== undefined) {
    options.port = c.port
  }
  client = new Client(options)
  return client
}

export function getBucket(): string {
  return cfg().bucket
}

export async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const mc = getMinio()
  const bucket = getBucket()
  const exists = await mc.bucketExists(bucket).catch(() => false)
  if (!exists) {
    await mc.makeBucket(bucket, '')
  }
  bucketReady = true
}

export async function putObject(
  key: string,
  body: Buffer,
  mime: string,
): Promise<void> {
  await ensureBucket()
  await getMinio().putObject(getBucket(), key, body, body.length, {
    'Content-Type': mime,
  })
}

export async function getObjectStream(key: string): Promise<Readable> {
  return getMinio().getObject(getBucket(), key)
}

export async function removeObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await getMinio().removeObjects(getBucket(), keys)
}
