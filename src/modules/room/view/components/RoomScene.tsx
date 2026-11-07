import type { ThreeEvent } from '@react-three/fiber'
import { useEffect } from 'react'
import { pointerCursor } from '../../../common/utils/pointerCursor'
import { CdShelf } from '../../../music/view/components/CdShelf/CdShelf'
import { useBurnedCdsStore } from '../../../music/view/hooks/useBurnedCdsStore'
import { useComposedShelf } from '../hooks/useComposedShelf'
import { useRoomStore } from '../hooks/useRoomStore'
import { useRoomTuningStore } from '../hooks/useRoomTuningStore'
import { SHELF_SPOT, STEREO_TRAY_POSITION } from '../utils/roomLayout'
import { RoomShell } from './RoomShell'
import { Stereo } from './Stereo'

export function RoomScene() {
  const fogColor = useRoomTuningStore((state) => state.fogColor)
  const fogNear = useRoomTuningStore((state) => state.fogNear)
  const fogFar = useRoomTuningStore((state) => state.fogFar)
  const wallColor = useRoomTuningStore((state) => state.wallColor)
  const wainscotColor = useRoomTuningStore((state) => state.wainscotColor)
  const floorColor = useRoomTuningStore((state) => state.floorColor)
  const focused = useRoomStore((state) => state.focused)
  const focus = useRoomStore((state) => state.focus)
  const back = useRoomStore((state) => state.back)
  const { cds } = useComposedShelf()
  const refreshBurned = useBurnedCdsStore((state) => state.refresh)

  useEffect(() => {
    void refreshBurned()
    const onFocus = () => void refreshBurned()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshBurned])

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
      <CdShelf
        cds={cds}
        interactive={focused === 'shelf'}
        onFocusShelf={() => focus('shelf')}
        position={SHELF_SPOT.position}
        trayClickable={focused !== 'overview'}
        trayPosition={STEREO_TRAY_POSITION}
      />
      <group onClick={focusStereo} {...pointerCursor}>
        <Stereo />
      </group>
    </>
  )
}
