import { NearestFilter, NearestMipmapNearestFilter, SRGBColorSpace, type Texture } from 'three'

export const RETRO_TEXTURE_MAX_SIZE = 256

export function retroTexture<T extends Texture>(texture: T): T {
  texture.magFilter = NearestFilter
  texture.minFilter = NearestMipmapNearestFilter
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function downscaleImage(
  image: HTMLImageElement | ImageBitmap,
  max = RETRO_TEXTURE_MAX_SIZE,
): HTMLCanvasElement {
  const size = fitWithin(image.width, image.height, max)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  canvas.getContext('2d')?.drawImage(image, 0, 0, size.width, size.height)
  return canvas
}
