import { z } from 'zod'

export const BURNED_CD_FORMAT_VERSION = 1

export const burnedCdRecordSchema = z.object({
  version: z.literal(BURNED_CD_FORMAT_VERSION),
  id: z.string().startsWith('burned-'),
  title: z.string().min(1),
  artist: z.string(),
  fileName: z.string().min(1),
  placeholderColor: z.string().min(1),
  burnedAt: z.number(),
  audio: z.instanceof(Blob),
  cover: z.instanceof(Blob).nullable(),
})
