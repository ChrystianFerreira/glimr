import { describe, expect, it } from 'vitest'
import { randomLightColor } from './randomLightColor'

const DARK_INK = '#1d1c24'

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function relativeLuminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

describe('randomLightColor', () => {
  it('returns a hex color with at least 7:1 contrast against the dark placeholder ink for many seeds', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const color = randomLightColor(seeded(seed))

      expect(color).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrast(color, DARK_INK)).toBeGreaterThanOrEqual(7)
    }
  })

  it('stays light at the edges of the random range', () => {
    for (const value of [0, 0.25, 0.5, 0.75, 0.999999]) {
      expect(contrast(randomLightColor(() => value), DARK_INK)).toBeGreaterThanOrEqual(7)
    }
  })

  it('varies the hue between draws', () => {
    const random = seeded(42)
    const colors = new Set(Array.from({ length: 20 }, () => randomLightColor(random)))

    expect(colors.size).toBeGreaterThan(10)
  })
})
