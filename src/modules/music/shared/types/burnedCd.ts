import type { z } from 'zod'
import type { burnedCdRecordSchema } from '../utils/burnedCdSchema'

export type BurnedCdRecord = z.output<typeof burnedCdRecordSchema>

export type NewBurnedCd = Omit<BurnedCdRecord, 'version' | 'id' | 'burnedAt'>
