import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useState } from 'react'
import { renderScale } from '../../../common/utils/renderScale'
import { loadRoom } from '../../shared/utils/loadRoom'
import { useRoomStore } from '../hooks/useRoomStore'
import { useRoomTuningStore } from '../hooks/useRoomTuningStore'
import { OVERVIEW_CAMERA } from '../utils/roomLayout'
import { RoomErrorBanner } from './RoomErrorBanner'
import { RoomScene } from './RoomScene'

const DevTools = import.meta.env.DEV ? lazy(() => import('./DevTools')) : null

export function RoomViewPage() {
  const setLoadResult = useRoomStore((state) => state.setLoadResult)
  const targetHeight = useRoomTuningStore((state) => state.targetHeight)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    let ignore = false
    void loadRoom().then((result) => {
      if (!ignore) setLoadResult(result)
    })
    return () => {
      ignore = true
    }
  }, [setLoadResult])

  const observeHeight = (element: HTMLDivElement) => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainerHeight(entry.contentRect.height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }

  return (
    <div className="room-view" ref={observeHeight}>
      <Canvas
        flat
        gl={{ antialias: false }}
        dpr={renderScale(targetHeight, containerHeight)}
        camera={{ position: OVERVIEW_CAMERA.position, fov: OVERVIEW_CAMERA.fov }}
        onCreated={({ camera }) => camera.lookAt(...OVERVIEW_CAMERA.target)}
      >
        <RoomScene />
      </Canvas>
      <RoomErrorBanner />
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </div>
  )
}
