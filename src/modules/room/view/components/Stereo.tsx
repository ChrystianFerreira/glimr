import { paint } from '../../../common/utils/paintVertexColors'
import { STEREO_POSITION, STEREO_SIZE, STEREO_TRAY_OFFSET } from '../utils/roomLayout'

const BODY_COLOR = '#b9bcc6'
const BODY_SHADOW = '#6c6f7d'
const GRILLE_COLOR = '#2b2a33'
const CONE_COLOR = '#4a4856'
const DUST_CAP_COLOR = '#8d8a99'
const TRAY_COLOR = '#16151c'
const DISPLAY_COLOR = '#5ce6ff'
const BUTTON_COLOR = '#ff8a3d'

const front = STEREO_SIZE.depth / 2
const speakerX = STEREO_SIZE.width / 2 - 0.17

export function Stereo() {
  return (
    <group position={STEREO_POSITION}>
      <mesh>
        <boxGeometry args={[STEREO_SIZE.width, STEREO_SIZE.height, STEREO_SIZE.depth]} ref={paint(BODY_SHADOW, BODY_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * speakerX, -0.03, front]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.145, 0.145, 0.01, 12]} ref={paint(GRILLE_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.01, 12]} ref={paint(CONE_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.012, 8]} ref={paint(DUST_CAP_COLOR)} />
            <meshBasicMaterial vertexColors />
          </mesh>
        </group>
      ))}

      <mesh position={STEREO_TRAY_OFFSET}>
        <boxGeometry args={[0.26, 0.035, 0.012]} ref={paint(TRAY_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh position={[0, -0.02, front + 0.004]}>
        <boxGeometry args={[0.18, 0.07, 0.008]} ref={paint(DISPLAY_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      {[-0.06, -0.02, 0.02, 0.06].map((x) => (
        <mesh key={x} position={[x, -0.12, front + 0.006]}>
          <boxGeometry args={[0.025, 0.02, 0.012]} ref={paint(BUTTON_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}

      <group position={[0, STEREO_SIZE.height / 2, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.3, 0.05, 0]}>
            <boxGeometry args={[0.04, 0.1, 0.05]} ref={paint(BODY_SHADOW)} />
            <meshBasicMaterial vertexColors />
          </mesh>
        ))}
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[0.64, 0.035, 0.05]} ref={paint(GRILLE_COLOR)} />
          <meshBasicMaterial vertexColors />
        </mesh>
      </group>
    </group>
  )
}
