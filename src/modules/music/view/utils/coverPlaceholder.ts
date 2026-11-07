import { CanvasTexture, type Texture } from 'three'
import { retroTexture } from '../../../common/utils/retroTexture'

const SIZE = 128
const PADDING = 12
const LINE_HEIGHT = 24
const BACKGROUND = '#4b2f86'
const INK = '#f3e9d2'
const BURNED_INK = '#1d1c24'

const placeholders = new Map<string, Texture>()
const burnedPlaceholders = new Map<string, Texture>()

function wrapWords(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1)
    if (last !== undefined && context.measureText(`${last} ${word}`).width <= maxWidth) {
      lines[lines.length - 1] = `${last} ${word}`
    } else {
      lines.push(word)
    }
  }
  return lines
}

function drawPlaceholder(title: string, background: string, ink: string): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = background
    context.fillRect(0, 0, SIZE, SIZE)
    context.fillStyle = ink
    context.font = 'bold 22px Tahoma, Verdana, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const lines = wrapWords(context, title, SIZE - PADDING * 2)
    const top = SIZE / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2
    lines.forEach((line, index) => context.fillText(line, SIZE / 2, top + index * LINE_HEIGHT, SIZE - PADDING * 2))
  }
  return retroTexture(new CanvasTexture(canvas))
}

/**
 * A flat cover with the CD's title on it, shared per title.
 * @example
 * <meshBasicMaterial map={coverPlaceholder('Test Tone A')} />
 */
export function coverPlaceholder(title: string): Texture {
  const cached = placeholders.get(title)
  if (cached) return cached
  const texture = drawPlaceholder(title, BACKGROUND, INK)
  placeholders.set(title, texture)
  return texture
}

/**
 * A burned CD's cover: its title in dark ink on its stored light color, one per CD id.
 * @example
 * <meshBasicMaterial map={burnedCoverPlaceholder(cd.id, cd.title, cd.placeholderColor)} />
 */
export function burnedCoverPlaceholder(id: string, title: string, color: string): Texture {
  const cached = burnedPlaceholders.get(id)
  if (cached) return cached
  const texture = drawPlaceholder(title, color, BURNED_INK)
  burnedPlaceholders.set(id, texture)
  return texture
}
