import { CameraControls, type CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { PerspectiveCamera } from 'three'
import { type RoomFocus, useRoomStore } from '../hooks/useRoomStore'
import { cameraFov, FOCUS_POSES, poseFraming } from '../utils/focusPoses'

const FIT_MARGIN = 1.12

type CameraRigProps = {
  shelfBandHeight: number
}

export function CameraRig({ shelfBandHeight }: CameraRigProps) {
  const focused = useRoomStore((state) => state.focused)
  const viewportWidth = useThree((state) => state.size.width)
  const viewportHeight = useThree((state) => state.size.height)
  const getThree = useThree((state) => state.get)
  const [controls, setControls] = useState<CameraControlsImpl | null>(null)
  const framedRef = useRef<RoomFocus | null>(null)

  useEffect(() => {
    if (!controls) return

    const { camera } = getThree()
    if (camera instanceof PerspectiveCamera) {
      camera.fov = cameraFov(viewportWidth / viewportHeight)
      camera.updateProjectionMatrix()
    }

    const pose = FOCUS_POSES[focused]
    // Same test as index.css's `orientation: portrait`, where the burn panel becomes a bottom band.
    const portrait = viewportHeight >= viewportWidth
    const reservedBottom = focused === 'shelf' && portrait ? shelfBandHeight / viewportHeight : 0
    const { center, toCamera, width, height, depth } = poseFraming(pose, reservedBottom)
    const distance = Math.max(controls.getDistanceToFitBox(width, height, depth) * FIT_MARGIN, pose.minDistance)
    const position = center.clone().addScaledVector(toCamera, distance)
    const animate = framedRef.current !== null && (framedRef.current !== focused || controls.active)
    framedRef.current = focused

    void controls.setLookAt(position.x, position.y, position.z, center.x, center.y, center.z, animate)
  }, [controls, focused, getThree, viewportWidth, viewportHeight, shelfBandHeight])

  return <CameraControls ref={setControls} makeDefault enabled={false} />
}
