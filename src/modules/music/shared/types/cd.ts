import type { z } from 'zod'
import type { cdSchema } from '../utils/cdSchema'
import type { BurnedCdRecord } from './burnedCd'

export type Cd = z.output<typeof cdSchema>

export type RoomShelfCd = Cd & { isBurned: false }

export type BurnedShelfCd = Pick<BurnedCdRecord, 'id' | 'title' | 'artist' | 'placeholderColor' | 'burnedAt'> & {
  isBurned: true
  audio: string
  cover: string | null
}

export type ShelfCd = RoomShelfCd | BurnedShelfCd
