import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BurnedCdRecord } from '../../shared/types/burnedCd'
import { createBurnedCdsStore } from './useBurnedCdsStore'

function record(index: number, withCover = false): BurnedCdRecord {
  return {
    version: 1,
    id: `burned-${index}`,
    title: `Song ${index}`,
    artist: 'Me',
    fileName: `song-${index}.mp3`,
    placeholderColor: '#f4e1c1',
    burnedAt: 1000 + index,
    audio: new Blob([`audio ${index}`], { type: 'audio/mpeg' }),
    cover: withCover ? new Blob([`cover ${index}`], { type: 'image/png' }) : null,
  }
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function setup(stored: BurnedCdRecord[] = []) {
  let next = 0
  const urls = new Map<Blob, string>()
  const decodes = new Map<string, () => void>()
  const deps = {
    list: vi.fn(() => Promise.resolve([...stored])),
    deleteRecord: vi.fn((id: string) => {
      stored.splice(
        stored.findIndex((cd) => cd.id === id),
        1,
      )
      return Promise.resolve()
    }),
    eject: vi.fn<(id: string) => void>(),
    createUrl: vi.fn((blob: Blob) => {
      const url = `blob:${next++}`
      urls.set(blob, url)
      return url
    }),
    revokeUrl: vi.fn<(url: string) => void>(),
    decodeCover: vi.fn((url: string) => {
      const done = deferred<void>()
      decodes.set(url, () => done.resolve())
      return done.promise
    }),
    forgetCover: vi.fn<(url: string) => void>(),
  }
  return { deps, urls, decodes, stored, store: createBurnedCdsStore(deps) }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useBurnedCdsStore', () => {
  it('builds burned shelf CDs from stored records, with an object URL for the audio and cover', async () => {
    const withCover = record(0, true)
    const { store, urls } = setup([withCover, record(1)])

    await store.getState().refresh()

    expect(store.getState().burned).toEqual([
      {
        isBurned: true,
        id: 'burned-0',
        title: 'Song 0',
        artist: 'Me',
        audio: urls.get(withCover.audio),
        cover: urls.get(withCover.cover as Blob),
        placeholderColor: '#f4e1c1',
        burnedAt: 1000,
      },
      expect.objectContaining({ id: 'burned-1', cover: null }),
    ])
  })

  it('keeps one audio URL per CD across refreshes', async () => {
    const { store, stored, deps } = setup([record(0)])
    await store.getState().refresh()
    const first = store.getState().burned[0]

    stored.push(record(1))
    await store.getState().refresh()

    expect(store.getState().burned[0]).toBe(first)
    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-0', 'burned-1'])
    expect(deps.createUrl).toHaveBeenCalledTimes(2)
    expect(deps.revokeUrl).not.toHaveBeenCalled()
  })

  it('revokes the cover URL once the cover is decoded, and never the audio URL', async () => {
    const { store, deps, decodes } = setup([record(0, true)])
    await store.getState().refresh()
    const { audio, cover } = store.getState().burned[0] ?? {}

    expect(deps.decodeCover).toHaveBeenCalledWith(cover, 'Song 0')
    expect(deps.revokeUrl).not.toHaveBeenCalled()

    decodes.get(cover as string)?.()
    await flush()

    expect(deps.revokeUrl).toHaveBeenCalledWith(cover)
    expect(deps.revokeUrl).not.toHaveBeenCalledWith(audio)
  })

  it('logs and keeps the previous list when reading storage fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { store, deps } = setup([record(0)])
    await store.getState().refresh()
    const before = store.getState().burned

    deps.list.mockRejectedValueOnce(new Error('blocked'))
    await store.getState().refresh()

    expect(store.getState().burned).toBe(before)
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('forgets a CD: drops it, revokes its URLs and drops its cover from the cover cache', async () => {
    const { store, deps } = setup([record(0, true), record(1)])
    await store.getState().refresh()
    const { audio, cover } = store.getState().burned[0] ?? {}

    store.getState().forget('burned-0')

    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-1'])
    expect(deps.revokeUrl).toHaveBeenCalledWith(audio)
    expect(deps.revokeUrl).toHaveBeenCalledWith(cover)
    expect(deps.forgetCover).toHaveBeenCalledWith(cover)
  })

  it('releases a CD whose record disappeared on refresh: ejects it and revokes its audio URL, keeping the rest', async () => {
    const { store, stored, deps } = setup([record(0), record(1, true), record(2)])
    await store.getState().refresh()
    const [first, gone, last] = store.getState().burned
    stored.splice(1, 1)

    await store.getState().refresh()

    expect(deps.eject).toHaveBeenCalledWith('burned-1')
    expect(deps.revokeUrl).toHaveBeenCalledWith(gone?.audio)
    expect(deps.forgetCover).toHaveBeenCalledWith(gone?.cover)
    expect(store.getState().burned).toEqual([first, last])
    expect(store.getState().burned[0]).toBe(first)
    expect(store.getState().burned[1]).toBe(last)
    expect(deps.createUrl).toHaveBeenCalledTimes(4)
    expect(deps.revokeUrl).not.toHaveBeenCalledWith(first?.audio)
    expect(deps.revokeUrl).not.toHaveBeenCalledWith(last?.audio)
  })

  it('does not bring back a forgotten CD from a refresh that was already reading storage', async () => {
    const { store, deps } = setup([record(0), record(1)])
    await store.getState().refresh()
    const reading = deferred<BurnedCdRecord[]>()
    deps.list.mockReturnValueOnce(reading.promise)

    const refresh = store.getState().refresh()
    store.getState().forget('burned-0')
    reading.resolve([record(0), record(1)])
    await refresh

    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-1'])
  })

  it('keeps the newest refresh when an older one finishes last', async () => {
    const { store, deps } = setup()
    const older = deferred<BurnedCdRecord[]>()
    const newer = deferred<BurnedCdRecord[]>()
    deps.list.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)

    const first = store.getState().refresh()
    const second = store.getState().refresh()
    newer.resolve([record(0), record(1)])
    await second
    older.resolve([record(0)])
    await first

    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-0', 'burned-1'])
  })

  it('removes a CD: ejects it, deletes its record, then revokes its URLs, and later CDs move up', async () => {
    const { store, deps } = setup([record(0), record(1), record(2)])
    await store.getState().refresh()
    const { audio } = store.getState().burned[1] ?? {}

    await store.getState().remove('burned-1')

    expect(deps.eject).toHaveBeenCalledWith('burned-1')
    expect(deps.eject.mock.invocationCallOrder[0]).toBeLessThan(deps.deleteRecord.mock.invocationCallOrder[0] ?? 0)
    expect(deps.deleteRecord.mock.invocationCallOrder[0]).toBeLessThan(deps.revokeUrl.mock.invocationCallOrder[0] ?? 0)
    expect(deps.revokeUrl).toHaveBeenCalledWith(audio)
    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-0', 'burned-2'])
  })

  it('keeps the CD and its URLs when deleting the record fails', async () => {
    const { store, deps } = setup([record(0)])
    await store.getState().refresh()
    deps.deleteRecord.mockRejectedValueOnce(new Error('blocked'))

    await expect(store.getState().remove('burned-0')).rejects.toThrow('blocked')

    expect(store.getState().burned.map((cd) => cd.id)).toEqual(['burned-0'])
    expect(deps.revokeUrl).not.toHaveBeenCalled()
  })
})
