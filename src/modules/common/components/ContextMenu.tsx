import { type KeyboardEvent, useEffect, useEffectEvent, useRef } from 'react'
import { pushOverlay } from '../utils/overlayStack'

export type ContextMenuAction = {
  label: string
  onSelect: () => void
}

type ContextMenuProps = {
  x: number
  y: number
  label: string
  actions: ContextMenuAction[]
  onClose: () => void
}

const EDGE_GAP = 8

function focusIndex(key: string, current: number, count: number) {
  switch (key) {
    case 'Home':
      return 0
    case 'End':
      return count - 1
    case 'ArrowDown':
      return (current + 1 + count) % count
    default:
      return (current - 1 + count) % count
  }
}

function moveFocus(menu: HTMLElement, key: string) {
  const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')]
  const current = items.indexOf(document.activeElement as HTMLElement)
  items[focusIndex(key, current, items.length)]?.focus()
}

/**
 * @example
 * <ContextMenu x={event.clientX} y={event.clientY} label="CD menu" actions={[{ label: 'Remove from shelf', onSelect: ask }]} onClose={close} />
 */
export function ContextMenu({ x, y, label, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const close = useEffectEvent(() => onClose())

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const { width, height } = menu.getBoundingClientRect()
    menu.style.left = `${Math.max(EDGE_GAP, Math.min(x, window.innerWidth - width - EDGE_GAP))}px`
    menu.style.top = `${Math.max(EDGE_GAP, Math.min(y, window.innerHeight - height - EDGE_GAP))}px`
    const pop = pushOverlay(menu, close)
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return pop
  }, [x, y])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    moveFocus(event.currentTarget, event.key)
  }

  return (
    <div ref={menuRef} className="win-menu" role="menu" aria-label={label} style={{ left: x, top: y }} onKeyDown={onKeyDown}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          className="win-menu-item"
          onClick={() => {
            onClose()
            action.onSelect()
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
