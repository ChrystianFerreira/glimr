import { CanvasTexture, type Texture } from 'three'
import { downscaleImage, retroTexture } from '../../../common/utils/retroTexture'
import { coverPlaceholder } from './coverPlaceholder'

type CoverSteps = {
  loadImage: (url: string) => Promise<HTMLImageElement>
  toTexture: (image: HTMLImageElement) => Texture
  placeholder: (title: string) => Texture
}

async function loadImageElement(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

function toCoverTexture(image: HTMLImageElement): Texture {
  return retroTexture(new CanvasTexture(downscaleImage(image)))
}

const DEFAULT_STEPS: CoverSteps = {
  loadImage: loadImageElement,
  toTexture: toCoverTexture,
  placeholder: coverPlaceholder,
}

const images = new Map<string, Promise<Texture | null>>()
const covers = new Map<string, Map<string, Promise<Texture>>>()

function loadImageTexture(url: string, steps: CoverSteps): Promise<Texture | null> {
  const cached = images.get(url)
  if (cached) return cached

  const texture = steps
    .loadImage(url)
    .then(steps.toTexture)
    .catch(() => null)
  images.set(url, texture)
  return texture
}

/**
 * Resolves to the cover downscaled to 256px, or to the title placeholder on any failure; cached per URL and title.
 * @example
 * const texture = use(loadCover(cd.cover, cd.title))
 */
export function loadCover(url: string, title: string, steps: CoverSteps = DEFAULT_STEPS): Promise<Texture> {
  const byTitle = covers.get(url) ?? new Map<string, Promise<Texture>>()
  covers.set(url, byTitle)

  const cached = byTitle.get(title)
  if (cached) return cached

  const cover = loadImageTexture(url, steps).then((texture) => texture ?? steps.placeholder(title))
  byTitle.set(title, cover)
  return cover
}

/**
 * Drops a URL's cached cover so the next call loads it fresh, and disposes its texture.
 * @example
 * forgetCover(removed.cover)
 */
export function forgetCover(url: string) {
  const image = images.get(url)
  images.delete(url)
  covers.delete(url)
  void image?.then((texture) => texture?.dispose())
}
