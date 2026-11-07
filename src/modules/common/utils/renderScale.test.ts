import { describe, expect, it } from 'vitest'
import { renderScale } from './renderScale'

describe('renderScale', () => {
  it('halves the resolution when the container is twice the target height', () => {
    expect(renderScale(480, 960)).toBe(0.5)
  })

  it('never upscales when the container is shorter than the target', () => {
    expect(renderScale(480, 300)).toBe(1)
  })

  it('returns the fallback instead of Infinity for a zero-height container', () => {
    expect(renderScale(480, 0)).toBe(1)
  })
})
