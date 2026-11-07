import { useRoomTuningStore } from '../hooks/useRoomTuningStore'
import { RoomShell } from './RoomShell'
import { Stereo } from './Stereo'

export function RoomScene() {
  const fogColor = useRoomTuningStore((state) => state.fogColor)
  const fogNear = useRoomTuningStore((state) => state.fogNear)
  const fogFar = useRoomTuningStore((state) => state.fogFar)
  const wallColor = useRoomTuningStore((state) => state.wallColor)
  const wainscotColor = useRoomTuningStore((state) => state.wainscotColor)
  const floorColor = useRoomTuningStore((state) => state.floorColor)

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <RoomShell wallColor={wallColor} wainscotColor={wainscotColor} floorColor={floorColor} />
      <Stereo />
    </>
  )
}
