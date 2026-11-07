import { openDB, type DBSchema } from 'idb'
import type { BurnedCdRecord, NewBurnedCd } from '../../shared/types/burnedCd'
import { BURNED_CD_FORMAT_VERSION, burnedCdRecordSchema } from '../../shared/utils/burnedCdSchema'

const DB_NAME = 'glimr'
const STORE = 'burnedCds'
const SHELF_SLOTS = 12

interface GlimrDb extends DBSchema {
  burnedCds: { key: string; value: BurnedCdRecord }
}

export class BurnedCdShelfFullError extends Error {
  name = 'BurnedCdShelfFullError'

  constructor() {
    super('The shelf is full.')
  }
}

export class BurnedCdSaveError extends Error {
  name = 'BurnedCdSaveError'

  constructor(cause: unknown) {
    super('Couldn’t save the CD in this browser.', { cause })
  }
}

function openGlimrDb() {
  return openDB<GlimrDb>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id' })
    },
  })
}

function newBurnedCdId() {
  return `burned-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function add(cd: NewBurnedCd, roomCdCount: number): Promise<BurnedCdRecord> {
  const record = burnedCdRecordSchema.parse({
    ...cd,
    version: BURNED_CD_FORMAT_VERSION,
    id: newBurnedCdId(),
    burnedAt: Date.now(),
  })
  const db = await openGlimrDb().catch((error: unknown) => {
    throw new BurnedCdSaveError(error)
  })
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const write = tx.store.count().then((stored) => {
      if (roomCdCount + stored >= SHELF_SLOTS) throw new BurnedCdShelfFullError()
      return tx.store.put(record)
    })
    await Promise.all([write, tx.done])
    return record
  } catch (error) {
    if (error instanceof BurnedCdShelfFullError) throw error
    throw new BurnedCdSaveError(error)
  } finally {
    db.close()
  }
}

async function list(): Promise<BurnedCdRecord[]> {
  const db = await openGlimrDb()
  try {
    const records: unknown[] = await db.getAll(STORE)
    return records
      .flatMap((record) => {
        const result = burnedCdRecordSchema.safeParse(record)
        if (result.success) return [result.data]
        console.warn('Skipping a stored burned CD that is not valid:', result.error.issues)
        return []
      })
      .sort((a, b) => a.burnedAt - b.burnedAt)
  } finally {
    db.close()
  }
}

async function remove(id: string): Promise<void> {
  const db = await openGlimrDb()
  try {
    await db.delete(STORE, id)
  } finally {
    db.close()
  }
}

/**
 * Burned CDs kept in this browser's IndexedDB, one record each.
 * @example
 * const saved = await burnedCdStore.add({ title, artist, fileName, placeholderColor, audio, cover }, roomCds.length)
 * const burned = await burnedCdStore.list()
 * await burnedCdStore.remove(saved.id)
 */
export const burnedCdStore = { add, list, remove }
