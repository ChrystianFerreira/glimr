import { z } from 'zod'
import { cdSchema } from '../../../music/shared/utils/cdSchema'

const cdListSchema = z.array(cdSchema).superRefine((cds, ctx) => {
  const seen = new Set<string>()
  cds.forEach((cd, index) => {
    if (seen.has(cd.id)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `Duplicate CD id "${cd.id}"`,
      })
    }
    seen.add(cd.id)
  })
})

const roomV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  cds: cdListSchema,
})

export const roomSchema = z.discriminatedUnion('version', [roomV1Schema])
