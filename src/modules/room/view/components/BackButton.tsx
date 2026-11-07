import { useEffect } from 'react'
import { hasOpenOverlay } from '../../../common/utils/overlayStack'
import { useRoomStore } from '../hooks/useRoomStore'

function isTextField(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function BackButton() {
  const focused = useRoomStore((state) => state.focused)
  const back = useRoomStore((state) => state.back)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !hasOpenOverlay() && !isTextField(event.target)) back()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [back])

  if (focused === 'overview') return null

  return (
    <button type="button" className="room-back-button" onClick={back}>
      ← Back
    </button>
  )
}
