import { parseBlob } from 'music-metadata'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readAudioTags } from './readAudioTags'

vi.mock('music-metadata', () => ({ parseBlob: vi.fn() }))

const parse = vi.mocked(parseBlob)

function metadataWith(common: { title?: string; artist?: string }) {
  return { common } as Awaited<ReturnType<typeof parseBlob>>
}

afterEach(() => {
  parse.mockReset()
})

describe('readAudioTags', () => {
  it('returns the title and artist from the tags as they are', async () => {
    parse.mockResolvedValue(metadataWith({ title: 'Clocks', artist: 'The Band' }))

    await expect(readAudioTags(new File(['x'], 'track01.mp3'))).resolves.toEqual({
      title: 'Clocks',
      artist: 'The Band',
    })
  })

  it('uses the file name without its extension and a blank artist for a tagless file', async () => {
    parse.mockResolvedValue(metadataWith({}))

    await expect(readAudioTags(new File(['x'], 'rainy-day.mp3'))).resolves.toEqual({
      title: 'rainy-day',
      artist: '',
    })
  })

  it('falls back to the file name instead of rejecting when the parser throws', async () => {
    parse.mockRejectedValue(new Error('Failed to determine audio format'))

    await expect(readAudioTags(new File(['x'], 'broken.song.flac'))).resolves.toEqual({
      title: 'broken.song',
      artist: '',
    })
  })
})
