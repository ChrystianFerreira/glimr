import type { ThreeEvent } from '@react-three/fiber'
import { useRoomStore } from '../hooks/useRoomStore'
import { useRoomTuningStore } from '../hooks/useRoomTuningStore'
import { boundsCenter, boundsSize, FOCUS_POSES } from '../utils/focusPoses'
import { pointerCursor } from '../utils/pointerCursor'
import { RoomShell } from './RoomShell'
import { Stereo } from './Stereo'

const shelfSpotCenter = boundsCenter(FOCUS_POSES.shelf.bounds)
const shelfSpotSize = boundsSize(FOCUS_POSES.shelf.bounds)

export function RoomScene() {
  const fogColor = useRoomTuningStore((state) => state.fogColor)
  const fogNear = useRoomTuningStore((state) => state.fogNear)
  const fogFar = useRoomTuningStore((state) => state.fogFar)
  const wallColor = useRoomTuningStore((state) => state.wallColor)
  const wainscotColor = useRoomTuningStore((state) => state.wainscotColor)
  const floorColor = useRoomTuningStore((state) => state.floorColor)
  const focus = useRoomStore((state) => state.focus)
  const back = useRoomStore((state) => state.back)

  const focusShelf = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    focus('shelf')
  }

  const focusStereo = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    focus('stereo')
  }

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <group onClick={back}>
        <RoomShell wallColor={wallColor} wainscotColor={wainscotColor} floorColor={floorColor} />
      </group>
      <mesh position={shelfSpotCenter} visible={false} onClick={focusShelf} {...pointerCursor}>
        <boxGeometry args={shelfSpotSize} />
      </mesh>
      <group onClick={focusStereo} {...pointerCursor}>
        <Stereo />
      </group>
    </>
  )
}
