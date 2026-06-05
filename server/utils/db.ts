const MANIFEST_KEY = 'metadata/photos.json'

export interface PhotoRow {
  id: string
  object_key: string
  thumb_key: string
  caption: string
  width: number
  height: number
  mime: string
  taken_at: string
  created_at: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toPhotoRow(value: unknown): PhotoRow | null {
  if (!isObjectRecord(value)) return null

  const id = String(value.id || '')
  const objectKey = String(value.object_key || '')
  const thumbKey = String(value.thumb_key || '')

  if (!id || !objectKey || !thumbKey) return null

  return {
    id,
    object_key: objectKey,
    thumb_key: thumbKey,
    caption: String(value.caption || ''),
    width: Number(value.width || 0),
    height: Number(value.height || 0),
    mime: String(value.mime || 'image/jpeg'),
    taken_at: String(value.taken_at || value.created_at || new Date(0).toISOString()),
    created_at: String(value.created_at || value.taken_at || new Date(0).toISOString()),
  }
}

function sortPhotos(rows: PhotoRow[]): PhotoRow[] {
  return [...rows].sort((a, b) => {
    const taken = b.taken_at.localeCompare(a.taken_at)
    return taken !== 0 ? taken : b.created_at.localeCompare(a.created_at)
  })
}

function isMissingObjectError(err: unknown): boolean {
  if (!isObjectRecord(err)) return false
  const code = String(err.code || err.name || '')
  const statusCode = Number(err.statusCode || 0)
  return statusCode === 404 || code === 'NoSuchKey' || code === 'NotFound'
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function readManifest(): Promise<PhotoRow[]> {
  await ensureBucket()

  try {
    const stream = await getObjectStream(MANIFEST_KEY)
    const payload = JSON.parse((await streamToBuffer(stream)).toString('utf8')) as unknown
    const photos = isObjectRecord(payload) && Array.isArray(payload.photos) ? payload.photos : []
    return sortPhotos(photos.map(toPhotoRow).filter((row): row is PhotoRow => row !== null))
  } catch (err) {
    if (isMissingObjectError(err)) {
      const rows = await listStoredPhotos()
      if (rows.length > 0) {
        await writeManifest(rows)
      }
      return rows
    }
    throw err
  }
}

async function listStoredPhotos(): Promise<PhotoRow[]> {
  const objects = await listObjects('photos/')
  const rows = objects
    .map((object) => {
      const match = object.name.match(/^photos\/(.+)\.([a-z0-9]+)$/i)
      if (!match) return null

      const [, id, ext] = match
      const createdAt = object.lastModified?.toISOString() || new Date(0).toISOString()
      return {
        id,
        object_key: object.name,
        thumb_key: `thumbs/${id}.webp`,
        caption: '',
        width: 0,
        height: 0,
        mime: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg',
        taken_at: createdAt,
        created_at: createdAt,
      } satisfies PhotoRow
    })
    .filter((row): row is PhotoRow => row !== null)

  return sortPhotos(rows)
}

async function writeManifest(rows: PhotoRow[]): Promise<void> {
  const body = Buffer.from(JSON.stringify({ photos: sortPhotos(rows) }, null, 2))
  await putObject(MANIFEST_KEY, body, 'application/json')
}

export async function listPhotos(): Promise<PhotoRow[]> {
  return readManifest()
}

export async function getPhoto(id: string): Promise<PhotoRow | undefined> {
  const rows = await readManifest()
  return rows.find((row) => row.id === id)
}

export async function insertPhoto(row: PhotoRow): Promise<void> {
  const rows = await readManifest()
  await writeManifest([...rows.filter((item) => item.id !== row.id), row])
}

export async function updateCaption(id: string, caption: string): Promise<boolean> {
  const rows = await readManifest()
  let found = false
  const next = rows.map((row) => {
    if (row.id !== id) return row
    found = true
    return { ...row, caption }
  })

  if (!found) return false
  await writeManifest(next)
  return true
}

export async function deletePhoto(id: string): Promise<boolean> {
  const rows = await readManifest()
  const next = rows.filter((row) => row.id !== id)
  if (next.length === rows.length) return false
  await writeManifest(next)
  return true
}
