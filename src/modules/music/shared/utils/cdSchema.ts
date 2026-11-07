import { z } from 'zod'

function toPublicUrl(path: string) {
  const segments = path.split('/').filter((segment) => segment !== '')
  return `/${segments.map(encodeURIComponent).join('/')}`
}

const publicPathSchema = z.string().min(1).transform(toPublicUrl)

export const cdSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string(),
  cover: publicPathSchema,
  audio: publicPathSchema,
})
