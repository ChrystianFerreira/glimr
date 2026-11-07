import {
  NearestFilter,
  NearestMipmapNearestFilter,
  SRGBColorSpace,
  Texture,
} from 'three'
import { describe, expect, it } from 'vitest'
import { fitWithin, retroTexture } from './retroTexture'

describe('retroTexture', () => {
  it('sets nearest filtering and the sRGB color space', () => {
    const texture = retroTexture(new Texture())

    expect(texture.magFilter).toBe(NearestFilter)
    expect(texture.minFilter).toBe(NearestMipmapNearestFilter)
    expect(texture.colorSpace).toBe(SRGBColorSpace)
  })
})

describe('fitWithin', () => {
  it('shrinks a square image to the max size', () => {
    expect(fitWithin(3000, 3000, 256)).toEqual({ width: 256, height: 256 })
  })

  it('keeps the aspect ratio when shrinking a wide image', () => {
    expect(fitWithin(3000, 1500, 256)).toEqual({ width: 256, height: 128 })
  })

  it('leaves an image that already fits unchanged', () => {
    expect(fitWithin(100, 100, 256)).toEqual({ width: 100, height: 100 })
  })
})
