import { useEffect } from 'react'
import { useRoomStore } from '../hooks/useRoomStore'

export function BackButton() {
  const focused = useRoomStore((state) => state.focused)
  const back = useRoomStore((state) => state.back)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') back()
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
