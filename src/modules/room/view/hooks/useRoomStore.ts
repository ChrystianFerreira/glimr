import { create } from 'zustand'
import type { Cd } from '../../../music/shared/types/cd'
import type { LoadRoomResult, Room, RoomLoadError, RoomSource } from '../../shared/types/room'

export type RoomLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; room: Room; shelf: Cd[]; source: RoomSource }
  | { status: 'error'; error: RoomLoadError }

type RoomStore = {
  load: RoomLoadState
  setLoadResult: (result: LoadRoomResult) => void
}

export const useRoomStore = create<RoomStore>()((set) => ({
  load: { status: 'loading' },
  setLoadResult: (result) =>
    set({
      load: result.ok
        ? { status: 'loaded', room: result.room, shelf: result.shelf, source: result.source }
        : { status: 'error', error: result.error },
    }),
}))
