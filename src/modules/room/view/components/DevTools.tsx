import { Stats } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { useState } from 'react'
import { DEFAULT_ROOM_TUNING, useRoomTuningStore } from '../hooks/useRoomTuningStore'

const LEVA_WIDTH = 280
const LEVA_EDGE = 10
const LEVA_BELOW_BACK = 44

export default function DevTools() {
  const setTuning = useRoomTuningStore((state) => state.setTuning)
  const [levaPosition] = useState(() => ({ x: LEVA_WIDTH + LEVA_EDGE * 2 - window.innerWidth, y: LEVA_BELOW_BACK }))

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
      <Leva collapsed titleBar={{ position: levaPosition }} />
      <Stats className="room-stats" />
    </>
  )
}
