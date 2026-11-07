import type { z } from 'zod'
import type { cdSchema } from '../utils/cdSchema'

export type Cd = z.output<typeof cdSchema>

export type RoomShelfCd = Cd & { isBurned: false }

export type BurnedShelfCd = {
  isBurned: true
  id: string
  title: string
  artist: string
  audio: string
  cover: string | null
  placeholderColor: string
  burnedAt: number
}

export type ShelfCd = RoomShelfCd | BurnedShelfCd
