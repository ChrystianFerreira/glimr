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

const covers = new Map<string, Promise<Texture>>()

/**
 * Resolves to the cover downscaled to 256px, or to the title placeholder on any failure; cached per URL.
 * @example
 * const texture = use(loadCover(cd.cover, cd.title))
 */
export function loadCover(url: string, title: string, steps: CoverSteps = DEFAULT_STEPS): Promise<Texture> {
  const cached = covers.get(url)
  if (cached) return cached

  const cover = steps
    .loadImage(url)
    .then(steps.toTexture)
    .catch(() => steps.placeholder(title))
  covers.set(url, cover)
  return cover
}
