import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

let db: DatabaseSync | null = null

function resolveDbPath(): string {
  const configured = process.env.NUXT_DB_PATH || useRuntimeConfig().dbPath
  return configured && configured.length > 0 ? configured : '.data/photos.db'
}

export function getDb(): DatabaseSync {
  if (db) return db

  const path = resolveDbPath()
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true })
  }

  db = new DatabaseSync(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id          TEXT PRIMARY KEY,
      object_key  TEXT NOT NULL,
      thumb_key   TEXT NOT NULL,
      caption     TEXT NOT NULL DEFAULT '',
      width       INTEGER NOT NULL DEFAULT 0,
      height      INTEGER NOT NULL DEFAULT 0,
      mime        TEXT NOT NULL DEFAULT 'image/jpeg',
      taken_at    TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos (taken_at DESC);
  `)
  return db
}

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

export function listPhotos(): PhotoRow[] {
  return getDb()
    .prepare('SELECT * FROM photos ORDER BY taken_at DESC, created_at DESC')
    .all() as unknown as PhotoRow[]
}

export function getPhoto(id: string): PhotoRow | undefined {
  return getDb().prepare('SELECT * FROM photos WHERE id = ?').get(id) as
    | PhotoRow
    | undefined
}

export function insertPhoto(row: PhotoRow): void {
  getDb()
    .prepare(
      `INSERT INTO photos
        (id, object_key, thumb_key, caption, width, height, mime, taken_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      row.id,
      row.object_key,
      row.thumb_key,
      row.caption,
      row.width,
      row.height,
      row.mime,
      row.taken_at,
      row.created_at,
    )
}

export function updateCaption(id: string, caption: string): boolean {
  const res = getDb()
    .prepare('UPDATE photos SET caption = ? WHERE id = ?')
    .run(caption, id)
  return res.changes > 0
}

export function deletePhoto(id: string): boolean {
  const res = getDb().prepare('DELETE FROM photos WHERE id = ?').run(id)
  return res.changes > 0
}
