import { create } from 'zustand'

export type RoomTuning = {
  targetHeight: number
  fogNear: number
  fogFar: number
  fogColor: string
  wallColor: string
  wainscotColor: string
  floorColor: string
}

export const DEFAULT_ROOM_TUNING: RoomTuning = {
  targetHeight: 480,
  fogNear: 1.5,
  fogFar: 11,
  fogColor: '#3a3150',
  wallColor: '#5f9a96',
  wainscotColor: '#6e5a96',
  floorColor: '#9a6a43',
}

type RoomTuningStore = RoomTuning & {
  setTuning: (tuning: Partial<RoomTuning>) => void
}

export const useRoomTuningStore = create<RoomTuningStore>()((set) => ({
  ...DEFAULT_ROOM_TUNING,
  setTuning: (tuning) => set(tuning),
}))
