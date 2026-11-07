import type { ThreeEvent } from '@react-three/fiber'
import type { Vector3Tuple } from 'three'
import { paint } from '../../../../common/utils/paintVertexColors'
import { pointerCursor } from '../../../../common/utils/pointerCursor'
import type { ShelfCd } from '../../../shared/types/cd'
import { usePlaybackStore } from '../../hooks/usePlaybackStore'
import { CD_SHELF_BACK_INSET, CD_SHELF_PANEL, CD_SHELF_ROW_FLOORS, CD_SHELF_SIZE } from '../../utils/cdShelfLayout'
import { CdCase } from './CdCase'

const WOOD_COLOR = '#c08552'
const WOOD_SHADOW = '#6e4528'
const BACK_COLOR = '#5a3a24'
const KICK_HEIGHT = CD_SHELF_ROW_FLOORS.at(-1) ?? 0

const { width, height, depth } = CD_SHELF_SIZE
const innerWidth = width - CD_SHELF_PANEL * 2

type CdShelfProps = {
  cds: ShelfCd[]
  interactive: boolean
  onFocusShelf: () => void
  position: Vector3Tuple
  trayClickable: boolean
  trayPosition: Vector3Tuple
}

function ShelfBody({ onClick }: { onClick: (event: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group onClick={onClick} {...pointerCursor}>
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

export function CdShelf({ cds, interactive, onFocusShelf, position, trayClickable, trayPosition }: CdShelfProps) {
  const select = usePlaybackStore((state) => state.select)
  const inTray = usePlaybackStore((state) => state.inTray)
  const trayInShelf: Vector3Tuple = [
    trayPosition[0] - position[0],
    trayPosition[1] - position[1],
    trayPosition[2] - position[2],
  ]

  const focusShelf = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onFocusShelf()
  }

  const clickCd = (cd: ShelfCd) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (interactive || usePlaybackStore.getState().inTray === cd.id) select(cd)
    else onFocusShelf()
  }

  return (
    <group position={position}>
      <ShelfBody onClick={focusShelf} />
      {cds.map((cd, index) => (
        <CdCase
          key={cd.id}
          cd={cd}
          slotIndex={index}
          trayInShelf={trayInShelf}
          onClick={cd.id !== inTray || trayClickable ? clickCd(cd) : undefined}
        />
      ))}
    </group>
  )
}
