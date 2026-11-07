import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewBurnedCd } from '../../shared/types/burnedCd'
import { BurnedCdSaveError, BurnedCdShelfFullError, burnedCdStore } from './burnedCdStore'

function newCd(title: string, overrides: Partial<NewBurnedCd> = {}): NewBurnedCd {
  return {
    title,
    artist: 'The Band',
    fileName: `${title}.mp3`,
    placeholderColor: '#f4e1c1',
    audio: new Blob([`audio of ${title}`], { type: 'audio/mpeg' }),
    cover: null,
    ...overrides,
  }
}

async function putRawRecords(records: unknown[]) {
  await burnedCdStore.list()
  const db = await openDB('glimr')
  const tx = db.transaction('burnedCds', 'readwrite')
  await Promise.all([...records.map((record) => tx.objectStore('burnedCds').put(record)), tx.done])
  db.close()
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('burnedCdStore', () => {
  it('lists an added CD with equal fields and its audio and cover bytes intact', async () => {
    const cover = new Blob(['cover bytes'], { type: 'image/png' })

    const added = await burnedCdStore.add(newCd('Clocks', { cover }), 4)
    const [listed] = await burnedCdStore.list()

    expect(added.id).toMatch(/^burned-/)
    expect(listed).toMatchObject({
      version: 1,
      id: added.id,
      title: 'Clocks',
      artist: 'The Band',
      fileName: 'Clocks.mp3',
      placeholderColor: '#f4e1c1',
      burnedAt: added.burnedAt,
    })
    expect(listed?.audio.type).toBe('audio/mpeg')
    await expect(listed?.audio.text()).resolves.toBe('audio of Clocks')
    expect(listed?.cover?.type).toBe('image/png')
    await expect(listed?.cover?.text()).resolves.toBe('cover bytes')
  })

  it('lists CDs oldest burn first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(3_000)
    await burnedCdStore.add(newCd('Third'), 0)
    vi.setSystemTime(1_000)
    await burnedCdStore.add(newCd('First'), 0)
    vi.setSystemTime(2_000)
    await burnedCdStore.add(newCd('Second'), 0)

    const titles = (await burnedCdStore.list()).map((cd) => cd.title)

    expect(titles).toEqual(['First', 'Second', 'Third'])
  })

  it('removes only the named CD', async () => {
    const keep = await burnedCdStore.add(newCd('Keep'), 0)
    const drop = await burnedCdStore.add(newCd('Drop'), 0)

    await burnedCdStore.remove(drop.id)

    expect((await burnedCdStore.list()).map((cd) => cd.id)).toEqual([keep.id])
  })

  it('skips records with an unknown version or missing fields, with a warning, and still loads the rest', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const added = await burnedCdStore.add(newCd('Added'), 0)
    const raw = { ...added, id: 'burned-raw', title: 'Raw', burnedAt: added.burnedAt + 1 }

    await putRawRecords([
      raw,
      { ...added, id: 'burned-future', version: 2 },
      { id: 'burned-partial', title: 'No audio' },
    ])
    const titles = (await burnedCdStore.list()).map((cd) => cd.title)

    expect(titles).toEqual(['Added', 'Raw'])
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('rejects with the shelf-full error and stores nothing when 8 burned CDs and 4 room CDs fill the shelf', async () => {
    for (let index = 0; index < 8; index += 1) {
      await burnedCdStore.add(newCd(`Cd ${index}`), 4)
    }

    await expect(burnedCdStore.add(newCd('One too many'), 4)).rejects.toBeInstanceOf(BurnedCdShelfFullError)
    expect(await burnedCdStore.list()).toHaveLength(8)
  })

  it.each(['QuotaExceededError', 'UnknownError'])(
    'rejects with the couldn’t-save error and leaves no record when the put fails with %s',
    async (errorName) => {
      const put = IDBObjectStore.prototype.put
      vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
        const request = put.apply(this, args)
        ;(this.transaction as IDBTransaction & { _abort: (name: string) => void })._abort(errorName)
        return request
      })

      const failure = burnedCdStore.add(newCd('Too big'), 0)

      await expect(failure).rejects.toBeInstanceOf(BurnedCdSaveError)
      await expect(failure).rejects.toMatchObject({ cause: expect.objectContaining({ name: errorName }) })
      vi.restoreAllMocks()
      expect(await burnedCdStore.list()).toEqual([])
    },
  )
})
