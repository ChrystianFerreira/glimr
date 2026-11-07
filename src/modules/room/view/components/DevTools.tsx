import { Stats } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { DEFAULT_ROOM_TUNING, useRoomTuningStore } from '../hooks/useRoomTuningStore'

export default function DevTools() {
  const setTuning = useRoomTuningStore((state) => state.setTuning)

  useControls('Room', {
    targetHeight: {
      value: DEFAULT_ROOM_TUNING.targetHeight,
      min: 120,
      max: 1080,
      step: 10,
      onChange: (targetHeight: number) => setTuning({ targetHeight }),
    },
    fogNear: {
      value: DEFAULT_ROOM_TUNING.fogNear,
      min: 0,
      max: 20,
      step: 0.1,
      onChange: (fogNear: number) => setTuning({ fogNear }),
    },
    fogFar: {
      value: DEFAULT_ROOM_TUNING.fogFar,
      min: 1,
      max: 40,
      step: 0.1,
      onChange: (fogFar: number) => setTuning({ fogFar }),
    },
    fogColor: {
      value: DEFAULT_ROOM_TUNING.fogColor,
      onChange: (fogColor: string) => setTuning({ fogColor }),
    },
    wallColor: {
      value: DEFAULT_ROOM_TUNING.wallColor,
      onChange: (wallColor: string) => setTuning({ wallColor }),
    },
    wainscotColor: {
      value: DEFAULT_ROOM_TUNING.wainscotColor,
      onChange: (wainscotColor: string) => setTuning({ wainscotColor }),
    },
    floorColor: {
      value: DEFAULT_ROOM_TUNING.floorColor,
      onChange: (floorColor: string) => setTuning({ floorColor }),
    },
  })

  return (
    <>
      <Leva collapsed />
      <Stats className="room-stats" />
    </>
  )
}
