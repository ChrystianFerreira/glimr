import type { Vector3Tuple } from 'three'
import { CD_SHELF_SIZE } from '../../../music/view/utils/cdShelfLayout'

export const ROOM_SIZE = { width: 6, height: 3, depth: 6 }

export const DESK_POSITION: Vector3Tuple = [1.55, 0, -2.6]
export const DESK_SIZE = { width: 1.7, height: 0.76, depth: 0.7 }

export const STEREO_SIZE = { width: 0.9, height: 0.42, depth: 0.26 }
export const STEREO_HANDLE_HEIGHT = 0.13
export const STEREO_POSITION: Vector3Tuple = [DESK_POSITION[0], DESK_SIZE.height + STEREO_SIZE.height / 2, -2.7]
export const STEREO_TRAY_OFFSET: Vector3Tuple = [0, 0.09, STEREO_SIZE.depth / 2 + 0.005]
export const STEREO_TRAY_POSITION: Vector3Tuple = [
  STEREO_POSITION[0] + STEREO_TRAY_OFFSET[0],
  STEREO_POSITION[1] + STEREO_TRAY_OFFSET[1],
  STEREO_POSITION[2] + STEREO_TRAY_OFFSET[2],
]

export const SHELF_SPOT: { position: Vector3Tuple; width: number; height: number } = {
  position: [-1.5, 0, -ROOM_SIZE.depth / 2 + CD_SHELF_SIZE.depth / 2],
  width: CD_SHELF_SIZE.width,
  height: CD_SHELF_SIZE.height,
}

export const OVERVIEW_CAMERA: { position: Vector3Tuple; target: Vector3Tuple; fov: number } = {
  position: [0.4, 1.75, 2.7],
  target: [-0.1, 1.05, -3],
  fov: 62,
}
