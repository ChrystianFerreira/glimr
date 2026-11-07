type Overlay = {
  element: HTMLElement
  close: () => void
  opener: HTMLElement | null
}

const stack: Overlay[] = []

function onKeyDown(event: KeyboardEvent) {
  const top = stack.at(-1)
  if (!top || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  top.close()
}

function onPointerDown(event: PointerEvent) {
  const top = stack.at(-1)
  if (!top || (event.target instanceof Node && top.element.contains(event.target))) return
  event.stopPropagation()
  swallowNextClick()
  top.close()
}

/**
 * Swallows the next click anywhere on the page, before any other listener sees it; the next pointerdown disarms it.
 * @example
 * swallowNextClick() // a long-press opened the menu, so the release click must not play the CD
 */
export function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    disarm()
  }
  const disarm = () => {
    window.removeEventListener('click', swallow, true)
    window.removeEventListener('pointerdown', disarm, true)
  }
  window.addEventListener('click', swallow, true)
  window.addEventListener('pointerdown', disarm, true)
}

/**
 * Puts an overlay on top: Esc and a pointerdown outside its element call `close`, newest first. The returned pop returns focus to what was focused before.
 * @example
 * useEffect(() => pushOverlay(menuRef.current, onClose), [])
 */
export function pushOverlay(element: HTMLElement, close: () => void): () => void {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const overlay: Overlay = { element, close, opener }
  if (stack.length === 0) {
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerdown', onPointerDown, true)
  }
  stack.push(overlay)

  return () => {
    const index = stack.indexOf(overlay)
    if (index === -1) return
    stack.splice(index, 1)
    if (stack.length === 0) {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
    if (opener?.isConnected) opener.focus()
  }
}

/**
 * @example
 * if (event.key === 'Escape' && !hasOpenOverlay()) back()
 */
export function hasOpenOverlay() {
  return stack.length > 0
}
