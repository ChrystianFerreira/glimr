import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { Suspense, use, useRef } from 'react'
import { Euler, type Group, MathUtils, Quaternion, type Texture, Vector3, type Vector3Tuple } from 'three'
import { paint } from '../../../../common/utils/paintVertexColors'
import { pointerCursor } from '../../../../common/utils/pointerCursor'
import type { ShelfCd } from '../../../shared/types/cd'
import { usePlaybackStore } from '../../hooks/usePlaybackStore'
import { CD_CASE_LEAN, CD_CASE_SIZE, cdSlotPosition } from '../../utils/cdShelfLayout'
import { burnedCoverPlaceholder, coverPlaceholder } from '../../utils/coverPlaceholder'
import { loadCover } from '../../utils/loadCover'

const CASE_COLOR = '#aeb6c8'
const CASE_SHADOW = '#5d6478'
const SPINE_COLOR = '#1d1c24'
const SPINE_WIDTH = 0.03
const HIT_BOX: [number, number, number] = [0.36, 0.4, 0.1]

const TRAVEL_SECONDS = 0.7
const ARC_HEIGHT = 0.35
const TRAY_SCALE = 0.75
const TRAY_OUTSET = 0.06

const SLOT_ROTATION = new Quaternion().setFromEuler(new Euler(CD_CASE_LEAN, 0, 0))
const TRAY_ROTATION = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))
const slot = new Vector3()
const tray = new Vector3()

const coverWidth = CD_CASE_SIZE.width - SPINE_WIDTH - 0.015
const coverHeight = CD_CASE_SIZE.height - 0.02
const coverX = SPINE_WIDTH / 2

function CoverFace({ texture }: { texture: Texture }) {
  return (
    <mesh position={[coverX, 0, CD_CASE_SIZE.thickness / 2 + 0.002]}>
      <planeGeometry args={[coverWidth, coverHeight]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function PlaceholderCover({ cd }: { cd: ShelfCd }) {
  const texture = cd.isBurned ? burnedCoverPlaceholder(cd.id, cd.title, cd.placeholderColor) : coverPlaceholder(cd.title)
  return <CoverFace texture={texture} />
}

function LoadedCover({ url, title }: { url: string; title: string }) {
  return <CoverFace texture={use(loadCover(url, title))} />
}

function Cover({ cd }: { cd: ShelfCd }) {
  if (!cd.cover) return <PlaceholderCover cd={cd} />
  return (
    <Suspense fallback={<PlaceholderCover cd={cd} />}>
      <LoadedCover url={cd.cover} title={cd.title} />
    </Suspense>
  )
}

type CdCaseProps = {
  cd: ShelfCd
  slotIndex: number
  trayInShelf: Vector3Tuple
  onClick?: (event: ThreeEvent<MouseEvent>) => void
}

export function CdCase({ cd, slotIndex, trayInShelf, onClick }: CdCaseProps) {
  const groupRef = useRef<Group>(null)
  const progressRef = useRef(0)
  const settledRef = useRef<{ slot: Vector3Tuple; tray: Vector3Tuple } | null>(null)
  const slotPosition = cdSlotPosition(slotIndex)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    const inTray = usePlaybackStore.getState().inTray === cd.id
    const target = inTray ? 1 : 0
    const settled = settledRef.current
    if (progressRef.current === target && settled?.slot === slotPosition && settled.tray === trayInShelf) return

    const step = delta / TRAVEL_SECONDS
    progressRef.current = MathUtils.clamp(progressRef.current + (inTray ? step : -step), 0, 1)
    const t = MathUtils.smootherstep(progressRef.current, 0, 1)

    slot.set(...slotPosition)
    tray.set(trayInShelf[0], trayInShelf[1], trayInShelf[2] + TRAY_OUTSET)
    group.position.lerpVectors(slot, tray, t)
    group.position.y += Math.sin(Math.PI * t) * ARC_HEIGHT
    group.quaternion.slerpQuaternions(SLOT_ROTATION, TRAY_ROTATION, t)
    group.scale.setScalar(MathUtils.lerp(1, TRAY_SCALE, t))
    settledRef.current = progressRef.current === target ? { slot: slotPosition, tray: trayInShelf } : null
  })

  return (
    <group ref={groupRef} {...(onClick ? { onClick, ...pointerCursor } : {})}>
      <mesh>
        <boxGeometry args={[CD_CASE_SIZE.width, CD_CASE_SIZE.height, CD_CASE_SIZE.thickness]} ref={paint(CASE_SHADOW, CASE_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh position={[-CD_CASE_SIZE.width / 2 + SPINE_WIDTH / 2, 0, 0]}>
        <boxGeometry args={[SPINE_WIDTH, CD_CASE_SIZE.height + 0.002, CD_CASE_SIZE.thickness + 0.004]} ref={paint(SPINE_COLOR)} />
        <meshBasicMaterial vertexColors />
      </mesh>
      <Cover cd={cd} />
      <mesh visible={false}>
        <boxGeometry args={HIT_BOX} />
      </mesh>
    </group>
  )
}
