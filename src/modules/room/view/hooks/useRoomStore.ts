import { create } from 'zustand'
import type { Cd } from '../../../music/shared/types/cd'
import type { LoadRoomResult, Room, RoomLoadError, RoomSource } from '../../shared/types/room'

export type RoomLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; room: Room; shelf: Cd[]; source: RoomSource }
  | { status: 'error'; error: RoomLoadError }

export type FocusTarget = 'shelf' | 'stereo'
export type RoomFocus = 'overview' | FocusTarget

type RoomStore = {
  load: RoomLoadState
  focused: RoomFocus
  setLoadResult: (result: LoadRoomResult) => void
  focus: (target: FocusTarget) => void
  back: () => void
}

export const useRoomStore = create<RoomStore>()((set) => ({
  load: { status: 'loading' },
  focused: 'overview',
  setLoadResult: (result) =>
    set({
      load: result.ok
        ? { status: 'loaded', room: result.room, shelf: result.shelf, source: result.source }
        : { status: 'error', error: result.error },
    }),
  focus: (target) => set((state) => (state.focused === target ? state : { focused: target })),
  back: () => set((state) => (state.focused === 'overview' ? state : { focused: 'overview' })),
}))
