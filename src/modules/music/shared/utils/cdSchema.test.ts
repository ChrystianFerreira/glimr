import { describe, expect, it } from 'vitest'
import { cdSchema } from './cdSchema'

const validCd = {
  id: 'cd-1',
  title: 'Test Tone A',
  artist: 'glimr',
  cover: 'media/example/cover-a.png',
  audio: 'media/example/tone-a.wav',
}

describe('cdSchema', () => {
  it('rejects an empty-string id', () => {
    const result = cdSchema.safeParse({ ...validCd, id: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['id'])
  })

  it('ignores an unknown extra field instead of rejecting it', () => {
    const result = cdSchema.safeParse({ ...validCd, year: 2003 })

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('year')
  })

  it('resolves paths with spaces and accents to encoded URLs under /', () => {
    const result = cdSchema.parse({
      ...validCd,
      cover: 'media/Café Tacvba/Re (Édition).png',
      audio: 'media/Café Tacvba/01 María.mp3',
    })

    expect(result.cover).toBe('/media/Caf%C3%A9%20Tacvba/Re%20(%C3%89dition).png')
    expect(result.audio).toBe('/media/Caf%C3%A9%20Tacvba/01%20Mar%C3%ADa.mp3')
  })
})
