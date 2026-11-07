import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { burnedCoverPlaceholder, coverPlaceholder } from './coverPlaceholder'

type FakeContext = { fillStyle: string; fills: string[]; texts: { text: string; color: string }[] }

let contexts: FakeContext[]

beforeEach(() => {
  contexts = []
  vi.stubGlobal('document', {
    createElement: () => {
      const context = {
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fills: [] as string[],
        texts: [] as { text: string; color: string }[],
        fillRect() {
          this.fills.push(this.fillStyle)
        },
        fillText(text: string) {
          this.texts.push({ text, color: this.fillStyle })
        },
        measureText: (text: string) => ({ width: text.length * 10 }),
      }
      contexts.push(context)
      return { width: 0, height: 0, getContext: () => context }
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

describe('burnedCoverPlaceholder', () => {
  it('gives two burned CDs with the same title but different colors their own textures', () => {
    const first = burnedCoverPlaceholder('burned-same-1', 'Same Title', '#f4e1c1')
    const second = burnedCoverPlaceholder('burned-same-2', 'Same Title', '#c1e4f4')

    expect(second).not.toBe(first)
    expect(contexts.map((context) => context.fills[0])).toEqual(['#f4e1c1', '#c1e4f4'])
  })

  it('draws the title in dark ink on the stored light color', () => {
    burnedCoverPlaceholder('burned-ink', 'Rainy Day', '#f4e1c1')

    const [context] = contexts
    expect(context?.texts.map(({ text }) => text)).toEqual(['Rainy Day'])
    expect(luminance(context?.texts[0]?.color ?? '#ffffff')).toBeLessThan(0.3)
  })

  it('reuses the texture for the same CD id', () => {
    const first = burnedCoverPlaceholder('burned-reuse', 'Again', '#f4e1c1')

    expect(burnedCoverPlaceholder('burned-reuse', 'Again', '#f4e1c1')).toBe(first)
    expect(contexts).toHaveLength(1)
  })

  it('keeps the room-file placeholder separate from a burned CD with the same title', () => {
    const roomFile = coverPlaceholder('Shared Name')

    expect(burnedCoverPlaceholder('burned-shared', 'Shared Name', '#f4e1c1')).not.toBe(roomFile)
    expect(luminance(contexts[0]?.texts[0]?.color ?? '#000000')).toBeGreaterThan(0.7)
  })
})
