import { Texture } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { forgetCover, loadCover } from './loadCover'

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
      placeholder: vi.fn<(title: string) => Texture>(() => placeholder),
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

  it('gives each title its own placeholder when two CDs share one missing cover', async () => {
    const { steps } = fakeSteps(() => Promise.reject(new Error('404')))
    const placeholders = new Map<string, Texture>()
    steps.placeholder.mockImplementation((title: string) => {
      const texture = new Texture()
      placeholders.set(title, texture)
      return texture
    })

    const first = await loadCover('/covers/shared-missing.png', 'First', steps)
    const second = await loadCover('/covers/shared-missing.png', 'Second', steps)

    expect(first).toBe(placeholders.get('First'))
    expect(second).toBe(placeholders.get('Second'))
    expect(steps.placeholder).toHaveBeenCalledWith('First')
    expect(steps.placeholder).toHaveBeenCalledWith('Second')
    expect(steps.loadImage).toHaveBeenCalledTimes(1)
  })

  it('returns the same cached promise for the same missing URL and title', () => {
    const { steps } = fakeSteps(() => Promise.reject(new Error('404')))

    const first = loadCover('/covers/missing-cached.png', 'Missing', steps)
    const second = loadCover('/covers/missing-cached.png', 'Missing', steps)

    expect(second).toBe(first)
  })

  it('loads a shared good cover once and gives every title the same texture', async () => {
    const { cover, steps } = fakeSteps(() => Promise.resolve(image))

    const first = await loadCover('/covers/shared-ok.png', 'First', steps)
    const second = await loadCover('/covers/shared-ok.png', 'Second', steps)

    expect(first).toBe(cover)
    expect(second).toBe(cover)
    expect(steps.loadImage).toHaveBeenCalledTimes(1)
    expect(steps.toTexture).toHaveBeenCalledTimes(1)
    expect(steps.placeholder).not.toHaveBeenCalled()
  })

  it('loads a URL fresh after it is forgotten, and disposes the old texture', async () => {
    const { cover, steps } = fakeSteps(() => Promise.resolve(image))
    const dispose = vi.spyOn(cover, 'dispose')
    const first = loadCover('blob:forgotten', 'Mine', steps)
    await first

    forgetCover('blob:forgotten')
    await Promise.resolve()
    const second = loadCover('blob:forgotten', 'Mine', steps)

    expect(second).not.toBe(first)
    expect(steps.loadImage).toHaveBeenCalledTimes(2)
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('leaves the shared placeholder alone when forgetting a cover that failed to load', async () => {
    const { placeholder, steps } = fakeSteps(() => Promise.reject(new Error('decode')))
    const dispose = vi.spyOn(placeholder, 'dispose')
    await loadCover('blob:broken', 'Broken', steps)

    forgetCover('blob:broken')
    await Promise.resolve()

    expect(dispose).not.toHaveBeenCalled()
  })
})
