import type { ThreeEvent } from '@react-three/fiber'
import { paint } from '../../../../common/utils/paintVertexColors'
import { pointerCursor } from '../../../../common/utils/pointerCursor'
import type { Cd } from '../../../shared/types/cd'
import { usePlaybackStore } from '../../hooks/usePlaybackStore'
import { CD_SHELF_BACK_INSET, CD_SHELF_PANEL, CD_SHELF_ROW_FLOORS, CD_SHELF_SIZE } from '../../utils/cdShelfLayout'
import { CdCase } from './CdCase'

const WOOD_COLOR = '#c08552'
const WOOD_SHADOW = '#6e4528'
const BACK_COLOR = '#5a3a24'
const KICK_HEIGHT = CD_SHELF_ROW_FLOORS.at(-1) ?? 0

const { width, height, depth } = CD_SHELF_SIZE
const innerWidth = width - CD_SHELF_PANEL * 2

type Vec3 = [number, number, number]

type CdShelfProps = {
  cds: Cd[]
  interactive: boolean
  onFocusShelf: () => void
  position: Vec3
  trayPosition: Vec3
}

function ShelfBody({ onClick }: { onClick: (event: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group onClick={onClick}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - CD_SHELF_PANEL / 2), height / 2, 0]}>
          <boxGeometry args={[CD_SHELF_PANEL, height, depth]} ref={paint(WOOD_SHADOW, WOOD_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}
      <mesh position={[0, height - CD_SHELF_PANEL / 2, 0]}>
        <boxGeometry args={[width, CD_SHELF_PANEL, depth]} ref={paint(WOOD_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2 + CD_SHELF_BACK_INSET - 0.01]}>
        <boxGeometry args={[innerWidth, height, 0.02]} ref={paint(BACK_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh position={[0, KICK_HEIGHT / 2, 0]}>
        <boxGeometry args={[innerWidth, KICK_HEIGHT, depth]} ref={paint(WOOD_SHADOW, WOOD_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      {CD_SHELF_ROW_FLOORS.slice(0, -1).map((floor) => (
        <mesh key={floor} position={[0, floor - CD_SHELF_PANEL / 2, 0]}>
          <boxGeometry args={[innerWidth, CD_SHELF_PANEL, depth]} ref={paint(WOOD_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}
    </group>
  )
}

export function CdShelf({ cds, interactive, onFocusShelf, position, trayPosition }: CdShelfProps) {
  const select = usePlaybackStore((state) => state.select)

  const focusShelf = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onFocusShelf()
  }

  const clickCd = (cd: Cd) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (interactive || usePlaybackStore.getState().inTray === cd.id) select(cd)
    else onFocusShelf()
  }

  return (
    <group position={position} {...pointerCursor}>
      <ShelfBody onClick={focusShelf} />
      {cds.map((cd, index) => (
        <CdCase key={cd.id} cd={cd} slotIndex={index} trayPosition={trayPosition} onClick={clickCd(cd)} />
      ))}
    </group>
  )
}
