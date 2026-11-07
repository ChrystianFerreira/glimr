import { describe, expect, it } from 'vitest'
import { burnedCdRecordSchema } from './burnedCdSchema'

const validRecord = {
  version: 1,
  id: 'burned-abc',
  title: 'Rainy Day',
  artist: '',
  fileName: 'rainy-day.mp3',
  placeholderColor: '#f4e1c1',
  burnedAt: 1_700_000_000_000,
  audio: new Blob(['audio'], { type: 'audio/mpeg' }),
  cover: null,
}

describe('burnedCdRecordSchema', () => {
  it('accepts a record without a cover and keeps the audio blob', () => {
    const result = burnedCdRecordSchema.parse(validRecord)

    expect(result.cover).toBeNull()
    expect(result.audio).toBe(validRecord.audio)
  })

  it('rejects an unknown format version', () => {
    const result = burnedCdRecordSchema.safeParse({ ...validRecord, version: 2 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['version'])
  })

  it('rejects a record whose audio is not a blob', () => {
    const result = burnedCdRecordSchema.safeParse({ ...validRecord, audio: 'media/tone.wav' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['audio'])
  })

  it('rejects an id without the burned- prefix so it cannot collide with room-file ids', () => {
    const result = burnedCdRecordSchema.safeParse({ ...validRecord, id: 'cd-1' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['id'])
  })
})
