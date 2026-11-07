import { Canvas } from '@react-three/fiber'
import { type CSSProperties, lazy, Suspense, useEffect, useState } from 'react'
import { renderScale } from '../../../common/utils/renderScale'
import { BurnPanel } from '../../../music/view/components/BurnPanel/BurnPanel'
import { NowPlayingStrip } from '../../../music/view/components/NowPlayingStrip'
import { useBurnedCdsStore } from '../../../music/view/hooks/useBurnedCdsStore'
import { composeShelf, SHELF_SLOTS } from '../../shared/utils/composeShelf'
import { loadRoom } from '../../shared/utils/loadRoom'
import { useRoomStore } from '../hooks/useRoomStore'
import { useRoomTuningStore } from '../hooks/useRoomTuningStore'
import { OVERVIEW_CAMERA } from '../utils/roomLayout'
import { BackButton } from './BackButton'
import { CameraRig } from './CameraRig'
import { RoomErrorBanner } from './RoomErrorBanner'
import { RoomScene } from './RoomScene'

const BURN_BAND_GAP = 16

const DevTools = import.meta.env.DEV ? lazy(() => import('./DevTools')) : null

export function RoomViewPage() {
  const setLoadResult = useRoomStore((state) => state.setLoadResult)
  const back = useRoomStore((state) => state.back)
  const load = useRoomStore((state) => state.load)
  const focused = useRoomStore((state) => state.focused)
  const burned = useBurnedCdsStore((state) => state.burned)
  const targetHeight = useRoomTuningStore((state) => state.targetHeight)
  const [containerHeight, setContainerHeight] = useState(0)
  const [burnPanelHeight, setBurnPanelHeight] = useState(0)

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

  const observeBurnPanel = (element: HTMLElement) => {
    const observer = new ResizeObserver(() => setBurnPanelHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }

  return (
    <div className="room-view" ref={observeHeight} style={{ '--burn-band': `${burnPanelHeight}px` } as CSSProperties}>
      <Canvas
        flat
        gl={{ antialias: false }}
        dpr={renderScale(targetHeight, containerHeight)}
        camera={{ fov: OVERVIEW_CAMERA.fov }}
        onPointerMissed={back}
      >
        <CameraRig shelfBandHeight={burnPanelHeight + BURN_BAND_GAP} />
        <RoomScene />
      </Canvas>
      <BackButton />
      {focused === 'shelf' && load.status === 'loaded' && (
        <BurnPanel
          ref={observeBurnPanel}
          shelfFull={composeShelf(load.shelf, burned).cds.length >= SHELF_SLOTS}
          roomCdCount={load.shelf.length}
        />
      )}
      <NowPlayingStrip />
      <RoomErrorBanner />
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </div>
  )
}
