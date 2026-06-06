import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
const HEIC_MIME = new Set(['image/heic', 'image/heif'])
const HEIC_EXT = new Set(['heic', 'heif'])

type HeicConverter = (options: {
  buffer: Buffer
  format: 'JPEG'
  quality: number
}) => Promise<Buffer | Uint8Array>

const require = createRequire(import.meta.url)

function fileExt(name: string): string {
  return (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizeMime(type: string | undefined, ext: string): string {
  if (HEIC_EXT.has(ext)) return 'image/heic'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return type || 'image/jpeg'
}

function isHeic(mime: string, ext: string): boolean {
  return HEIC_MIME.has(mime) || HEIC_EXT.has(ext)
}

async function normalizeImage(
  data: Buffer,
  mime: string,
  ext: string,
): Promise<{ data: Buffer; mime: string; ext: string }> {
  if (!isHeic(mime, ext)) {
    return { data, mime, ext }
  }

  try {
    const convertHeic = require('heic-convert') as HeicConverter
    const converted = await convertHeic({
      buffer: data,
      format: 'JPEG',
      quality: 0.92,
    })

    return {
      data: Buffer.from(converted),
      mime: 'image/jpeg',
      ext: 'jpg',
    }
  } catch (err) {
    console.warn('heic conversion failed; storing original file', err)
    return { data, mime: 'image/heic', ext: ext || 'heic' }
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file diunggah.' })
  }

  const files = parts.filter((p) => p.name === 'files' && p.filename && p.data?.length)
  if (files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada file gambar valid.' })
  }

  const nowIso = new Date().toISOString()
  const uploaded: Array<{ id: string; caption: string }> = []
  const errors: Array<{ file: string; reason: string }> = []

  for (const file of files) {
    const name = file.filename || 'foto'
    try {
      if (file.data.length > MAX_BYTES) {
        errors.push({ file: name, reason: 'Ukuran melebihi 25MB.' })
        continue
      }
      const ext = fileExt(name)
      const mime = normalizeMime(file.type, ext)
      if (!ALLOWED.has(mime)) {
        errors.push({ file: name, reason: `Tipe tidak didukung (${mime}).` })
        continue
      }

      const id = randomUUID()
      const source = await normalizeImage(file.data, mime, ext)
      const objectKey = `photos/${id}.${source.ext || 'jpg'}`
      const thumbKey = `thumbs/${id}.${source.ext || 'jpg'}`

      await putObject(objectKey, source.data, source.mime)
      await putObject(thumbKey, source.data, source.mime)

      await insertPhoto({
        id,
        object_key: objectKey,
        thumb_key: thumbKey,
        caption: '',
        width: 0,
        height: 0,
        mime: source.mime,
        taken_at: nowIso,
        created_at: nowIso,
      })

      uploaded.push({ id, caption: '' })
    } catch (err) {
      errors.push({ file: name, reason: err instanceof Error ? err.message : 'Gagal memproses gambar.' })
      console.error('upload error', name, err)
    }
  }

  if (uploaded.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Semua file gagal diproses.',
      data: { errors },
    })
  }

  return { uploaded, errors, count: uploaded.length }
})
