function hslToHex(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12
    const value = lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1)) / 2
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

/**
 * A pastel color light enough for dark text, as `#rrggbb`.
 * @example
 * randomLightColor() // '#f2d4c8'
 * randomLightColor(() => 0.5) // '#c6f1f1'
 */
export function randomLightColor(random: () => number = Math.random) {
  return hslToHex(random() * 360, 0.45 + random() * 0.3, 0.82 + random() * 0.08)
}
