import type { z } from 'zod'
import type { cdSchema } from '../utils/cdSchema'

export type Cd = z.output<typeof cdSchema>
