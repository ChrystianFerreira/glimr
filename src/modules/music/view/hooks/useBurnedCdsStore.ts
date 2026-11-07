import { create } from 'zustand'
import type { BurnedCdRecord } from '../../shared/types/burnedCd'
import type { BurnedShelfCd } from '../../shared/types/cd'
import { burnedCdStore } from '../utils/burnedCdStore'
import { forgetCover, loadCover } from '../utils/loadCover'
import { usePlaybackStore } from './usePlaybackStore'

type BurnedCdsDeps = {
  list: () => Promise<BurnedCdRecord[]>
  deleteRecord: (id: string) => Promise<void>
  eject: (id: string) => void
  createUrl: (blob: Blob) => string
  revokeUrl: (url: string) => void
  decodeCover: (url: string, title: string) => Promise<unknown>
  forgetCover: (url: string) => void
}

type BurnedCdsStore = {
  burned: BurnedShelfCd[]
  refresh: () => Promise<void>
  forget: (id: string) => void
  remove: (id: string) => Promise<void>
}

const DEFAULT_DEPS: BurnedCdsDeps = {
  list: burnedCdStore.list,
  deleteRecord: burnedCdStore.remove,
  eject: (id) => usePlaybackStore.getState().eject(id),
  createUrl: (blob) => URL.createObjectURL(blob),
  revokeUrl: (url) => URL.revokeObjectURL(url),
  decodeCover: loadCover,
  forgetCover,
}

/**
 * @example
 * const store = createBurnedCdsStore({ list, deleteRecord, eject, createUrl, revokeUrl, decodeCover, forgetCover })
 * await store.getState().refresh()
 * await store.getState().remove(cd.id) // ejects it if current, deletes the record, then revokes its URLs
 */
export function createBurnedCdsStore(deps: BurnedCdsDeps = DEFAULT_DEPS) {
  let latestRefresh = 0
  const forgotten = new Set<string>()

  const toShelfCd = (record: BurnedCdRecord): BurnedShelfCd => {
    const cover = record.cover ? deps.createUrl(record.cover) : null
    if (cover) void deps.decodeCover(cover, record.title).then(() => deps.revokeUrl(cover))
    return {
      isBurned: true,
      id: record.id,
      title: record.title,
      artist: record.artist,
      audio: deps.createUrl(record.audio),
      cover,
      placeholderColor: record.placeholderColor,
      burnedAt: record.burnedAt,
    }
  }

  return create<BurnedCdsStore>()((set, get) => ({
    burned: [],
    refresh: async () => {
      const refresh = ++latestRefresh
      let records: BurnedCdRecord[]
      try {
        records = await deps.list()
      } catch (error) {
        console.error('Couldn’t read the burned CDs from this browser:', error)
        return
      }
      if (refresh !== latestRefresh) return
      const known = new Map(get().burned.map((cd) => [cd.id, cd]))
      set({
        burned: records.filter((record) => !forgotten.has(record.id)).map((record) => known.get(record.id) ?? toShelfCd(record)),
      })
    },
    forget: (id) => {
      forgotten.add(id)
      const cd = get().burned.find((burned) => burned.id === id)
      if (!cd) return
      set({ burned: get().burned.filter((burned) => burned.id !== id) })
      deps.revokeUrl(cd.audio)
      if (cd.cover) {
        deps.revokeUrl(cd.cover)
        deps.forgetCover(cd.cover)
      }
    },
    remove: async (id) => {
      deps.eject(id)
      await deps.deleteRecord(id)
      get().forget(id)
      await get().refresh()
    },
  }))
}

export const useBurnedCdsStore = createBurnedCdsStore()
