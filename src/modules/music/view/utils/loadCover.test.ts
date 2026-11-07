import { Texture } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { loadCover } from './loadCover'

const image = {} as HTMLImageElement

function fakeSteps(loadImage: (url: string) => Promise<HTMLImageElement>) {
  const cover = new Texture()
  const placeholder = new Texture()
  return {
    cover,
    placeholder,
    steps: {
      loadImage: vi.fn(loadImage),
      toTexture: vi.fn(() => cover),
      placeholder: vi.fn(() => placeholder),
    },
  }
}

describe('loadCover', () => {
  it('resolves to the cover texture made from the loaded image', async () => {
    const { cover, steps } = fakeSteps(() => Promise.resolve(image))

    await expect(loadCover('/covers/ok.png', 'Ok', steps)).resolves.toBe(cover)
    expect(steps.toTexture).toHaveBeenCalledWith(image)
  })

  it('resolves to the placeholder instead of rejecting when the image is missing', async () => {
    const { placeholder, steps } = fakeSteps(() => Promise.reject(new Error('404')))

    await expect(loadCover('/covers/missing.png', 'Missing', steps)).resolves.toBe(placeholder)
    expect(steps.placeholder).toHaveBeenCalledWith('Missing')
  })

  it('returns the same cached promise for the same URL', () => {
    const { steps } = fakeSteps(() => Promise.resolve(image))

    const first = loadCover('/covers/cached.png', 'Cached', steps)
    const second = loadCover('/covers/cached.png', 'Cached', steps)

    expect(second).toBe(first)
    expect(steps.loadImage).toHaveBeenCalledTimes(1)
  })
})
