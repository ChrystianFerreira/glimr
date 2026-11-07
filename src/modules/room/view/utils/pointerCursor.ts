import type { ThreeEvent } from '@react-three/fiber'

export const pointerCursor = {
  onPointerOver: (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    document.body.style.cursor = 'pointer'
  },
  onPointerOut: () => {
    document.body.style.cursor = ''
  },
}
