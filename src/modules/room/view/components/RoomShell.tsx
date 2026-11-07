import { Color, type ColorRepresentation, type Vector3Tuple } from 'three'
import { paint } from '../../../common/utils/paintVertexColors'
import { DESK_POSITION, DESK_SIZE, ROOM_SIZE } from '../utils/roomLayout'

const WAINSCOT_HEIGHT = 0.9
const CEILING_COLOR = '#d6cce0'
const TRIM_COLOR = '#efe4cc'
const BASEBOARD_COLOR = '#3d3248'
const DESK_COLOR = '#7a5236'
const RUG_COLOR = '#b0507a'
const RUG_BORDER_COLOR = '#3f8f8a'
const LAMP_COLOR = '#fff2c4'
const SKY_TOP = '#7fb8ff'
const SKY_BOTTOM = '#ffb98a'
const POSTER_TOP = '#ff7ab8'
const POSTER_BOTTOM = '#ffd36b'

const halfWidth = ROOM_SIZE.width / 2
const halfDepth = ROOM_SIZE.depth / 2

const WALLS: { position: Vector3Tuple; rotationY: number; width: number }[] = [
  { position: [0, 0, -halfDepth], rotationY: 0, width: ROOM_SIZE.width },
  { position: [0, 0, halfDepth], rotationY: Math.PI, width: ROOM_SIZE.width },
  { position: [-halfWidth, 0, 0], rotationY: Math.PI / 2, width: ROOM_SIZE.depth },
  { position: [halfWidth, 0, 0], rotationY: -Math.PI / 2, width: ROOM_SIZE.depth },
]

function darker(color: ColorRepresentation, factor: number) {
  return new Color(color).multiplyScalar(factor)
}

type RoomShellProps = {
  wallColor: string
  wainscotColor: string
  floorColor: string
}

export function RoomShell({ wallColor, wainscotColor, floorColor }: RoomShellProps) {
  const upperHeight = ROOM_SIZE.height - WAINSCOT_HEIGHT

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE.width, ROOM_SIZE.depth, 6, 6]} ref={paint(floorColor, darker(floorColor, 0.7))} />
        <meshBasicMaterial vertexColors />
      </mesh>

      <mesh position={[0, ROOM_SIZE.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE.width, ROOM_SIZE.depth]} ref={paint(darker(CEILING_COLOR, 0.65), CEILING_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>

      {WALLS.map((wall) => (
        <group key={wall.rotationY} position={wall.position} rotation={[0, wall.rotationY, 0]}>
          <mesh position={[0, WAINSCOT_HEIGHT + upperHeight / 2, 0]}>
            <planeGeometry args={[wall.width, upperHeight, 1, 4]} ref={paint(darker(wallColor, 0.75), wallColor)} />
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh position={[0, WAINSCOT_HEIGHT / 2, 0]}>
            <planeGeometry args={[wall.width, WAINSCOT_HEIGHT]} ref={paint(darker(wainscotColor, 0.6), wainscotColor)} />
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh position={[0, WAINSCOT_HEIGHT, 0.02]}>
            <boxGeometry args={[wall.width, 0.06, 0.04]} ref={paint(TRIM_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh position={[0, 0.06, 0.015]}>
            <boxGeometry args={[wall.width, 0.12, 0.03]} ref={paint(BASEBOARD_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
        </group>
      ))}

      <group position={[halfWidth, 1.65, -0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 1.15, 0.08]} ref={paint(TRIM_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.22, 0.97]} ref={paint(SKY_BOTTOM, SKY_TOP)} />
          <meshBasicMaterial vertexColors />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[0.05, 0.97, 0.02]} ref={paint(TRIM_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[1.22, 0.05, 0.02]} ref={paint(TRIM_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
      </group>

      <mesh position={[-halfWidth + 0.01, 1.7, -1.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.7, 0.95]} ref={paint(POSTER_BOTTOM, POSTER_TOP)} />
        <meshBasicMaterial vertexColors />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[2.6, 0.02, 1.8]} ref={paint(RUG_BORDER_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[2.3, 0.02, 1.5]} ref={paint(RUG_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>

      <mesh position={[0, ROOM_SIZE.height - 0.03, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 10]} ref={paint(LAMP_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>

      <group position={DESK_POSITION}>
        <mesh position={[0, DESK_SIZE.height - 0.025, 0]}>
          <boxGeometry args={[DESK_SIZE.width, 0.05, DESK_SIZE.depth]} ref={paint(DESK_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (DESK_SIZE.width / 2 - 0.04), (DESK_SIZE.height - 0.05) / 2, 0]}>
            <boxGeometry args={[0.05, DESK_SIZE.height - 0.05, DESK_SIZE.depth - 0.04]} ref={paint(darker(DESK_COLOR, 0.7), DESK_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
        ))}
      </group>
    </>
  )
}
