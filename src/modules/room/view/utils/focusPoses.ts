import { MathUtils, Vector3, type Vector3Tuple } from 'three'
import type { RoomFocus } from '../hooks/useRoomStore'
import {
  OVERVIEW_CAMERA,
  ROOM_SIZE,
  SHELF_SPOT,
  STEREO_HANDLE_HEIGHT,
  STEREO_POSITION,
  STEREO_SIZE,
} from './roomLayout'

type Bounds = { min: Vector3Tuple; max: Vector3Tuple }

type FocusPose = {
  bounds: Bounds
  direction: Vector3Tuple
  minDistance: number
}

const backWallZ = -ROOM_SIZE.depth / 2

const shelfBounds: Bounds = {
  min: [SHELF_SPOT.position[0] - SHELF_SPOT.width / 2, SHELF_SPOT.position[1], backWallZ],
  max: [
    SHELF_SPOT.position[0] + SHELF_SPOT.width / 2,
    SHELF_SPOT.position[1] + SHELF_SPOT.height,
    2 * SHELF_SPOT.position[2] - backWallZ,
  ],
}

const stereoBounds: Bounds = {
  min: [
    STEREO_POSITION[0] - STEREO_SIZE.width / 2,
    STEREO_POSITION[1] - STEREO_SIZE.height / 2,
    STEREO_POSITION[2] - STEREO_SIZE.depth / 2,
  ],
  max: [
    STEREO_POSITION[0] + STEREO_SIZE.width / 2,
    STEREO_POSITION[1] + STEREO_SIZE.height / 2 + STEREO_HANDLE_HEIGHT,
    STEREO_POSITION[2] + STEREO_SIZE.depth / 2,
  ],
}

function union(...all: Bounds[]): Bounds {
  return {
    min: [0, 1, 2].map((axis) => Math.min(...all.map((bounds) => bounds.min[axis]!))) as Vector3Tuple,
    max: [0, 1, 2].map((axis) => Math.max(...all.map((bounds) => bounds.max[axis]!))) as Vector3Tuple,
  }
}

const overviewDirection = new Vector3(...OVERVIEW_CAMERA.position).sub(new Vector3(...OVERVIEW_CAMERA.target))

export const FOCUS_POSES: Record<RoomFocus, FocusPose> = {
  overview: {
    bounds: union(shelfBounds, stereoBounds),
    direction: overviewDirection.toArray(),
    minDistance: overviewDirection.length(),
  },
  shelf: { bounds: shelfBounds, direction: [0.25, 0.3, 1], minDistance: 0 },
  stereo: { bounds: stereoBounds, direction: [-0.3, 0.35, 1], minDistance: 0 },
}

function boundsCenter({ min, max }: Bounds): Vector3Tuple {
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
}

function boundsSize({ min, max }: Bounds): Vector3Tuple {
  return [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
}

const MIN_HORIZONTAL_FOV = 50

/**
 * Widens the vertical FOV on portrait screens so the back of the room fits without leaving it.
 * @example
 * cameraFov(1280 / 800) // 62
 * cameraFov(390 / 844) // ~90
 */
export function cameraFov(aspect: number) {
  const minHalfWidth = Math.tan(MathUtils.degToRad(MIN_HORIZONTAL_FOV / 2))
  return Math.max(OVERVIEW_CAMERA.fov, MathUtils.radToDeg(2 * Math.atan(minHalfWidth / aspect)))
}

const WORLD_UP = new Vector3(0, 1, 0)

/**
 * The box's extents as the camera sees it from the pose's direction, for `getDistanceToFitBox`, optionally keeping the bottom fraction of the view clear.
 * @example
 * const { center, toCamera, width, height, depth } = poseFraming(FOCUS_POSES.shelf)
 * poseFraming(FOCUS_POSES.shelf, 0.35) // shelf fits in the top 65% of the view
 */
export function poseFraming({ bounds, direction }: FocusPose, reservedBottom = 0) {
  const center = new Vector3(...boundsCenter(bounds))
  const half = new Vector3(...boundsSize(bounds)).multiplyScalar(0.5)
  const toCamera = new Vector3(...direction).normalize()
  const forward = toCamera.clone().negate()
  const right = new Vector3().crossVectors(forward, WORLD_UP).normalize()
  const up = new Vector3().crossVectors(right, forward)
  const extent = (axis: Vector3) =>
    2 * (Math.abs(half.x * axis.x) + Math.abs(half.y * axis.y) + Math.abs(half.z * axis.z))

  const height = extent(up)
  const framedHeight = height / (1 - reservedBottom)
  center.addScaledVector(up, -(framedHeight - height) / 2)

  return { center, toCamera, width: extent(right), height: framedHeight, depth: extent(forward) }
}
