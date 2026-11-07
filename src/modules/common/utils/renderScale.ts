const FALLBACK_SCALE = 1

export function renderScale(targetHeight: number, containerHeight: number): number {
  if (!(containerHeight > 0)) return FALLBACK_SCALE
  return Math.min(1, targetHeight / containerHeight)
}
