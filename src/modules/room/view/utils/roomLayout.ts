export type Vec3 = [number, number, number]

export const ROOM_SIZE = { width: 6, height: 3, depth: 6 }

export const DESK_POSITION: Vec3 = [1.55, 0, -2.6]
export const DESK_SIZE = { width: 1.7, height: 0.76, depth: 0.7 }

export const STEREO_SIZE = { width: 0.9, height: 0.42, depth: 0.26 }
export const STEREO_POSITION: Vec3 = [DESK_POSITION[0], DESK_SIZE.height + STEREO_SIZE.height / 2, -2.7]
export const STEREO_TRAY_OFFSET: Vec3 = [0, 0.09, STEREO_SIZE.depth / 2 + 0.005]
export const STEREO_TRAY_POSITION: Vec3 = [
  STEREO_POSITION[0] + STEREO_TRAY_OFFSET[0],
  STEREO_POSITION[1] + STEREO_TRAY_OFFSET[1],
  STEREO_POSITION[2] + STEREO_TRAY_OFFSET[2],
]

export const SHELF_SPOT: { position: Vec3; width: number; height: number } = {
  position: [-1.5, 0, -2.85],
  width: 1.6,
  height: 1.9,
}

export const OVERVIEW_CAMERA: { position: Vec3; target: Vec3; fov: number } = {
  position: [0.4, 1.75, 2.7],
  target: [-0.1, 1.05, -3],
  fov: 62,
}
