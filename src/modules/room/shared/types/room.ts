import type { z } from 'zod'
import type { Cd } from '../../../music/shared/types/cd'
import type { roomSchema } from '../utils/roomSchema'

export type Room = z.output<typeof roomSchema>

export type RoomSource = '/room.json' | '/room.example.json'

export type RoomLoadError = {
  reason: 'unreachable' | 'invalid-json' | 'invalid-room'
  source: RoomSource
  path: string
  message: string
}

export type LoadRoomResult =
  | { ok: true; room: Room; shelf: Cd[]; source: RoomSource }
  | { ok: false; error: RoomLoadError }
