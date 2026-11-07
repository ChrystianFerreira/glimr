import { BufferAttribute, type BufferGeometry, Color, type ColorRepresentation, Vector3 } from 'three'

const LIGHT_DIRECTION = new Vector3(0.35, 1, 0.55).normalize()
const AMBIENT = 0.6

export function paintVertexColors(
  geometry: BufferGeometry,
  bottom: ColorRepresentation,
  top: ColorRepresentation = bottom,
): void {
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  geometry.computeBoundingBox()
  const minY = geometry.boundingBox?.min.y ?? 0
  const spanY = (geometry.boundingBox?.max.y ?? 0) - minY || 1

  const bottomColor = new Color(bottom)
  const topColor = new Color(top)
  const color = new Color()
  const normal = new Vector3()
  const colors = new Float32Array(positions.count * 3)

  for (let i = 0; i < positions.count; i++) {
    const t = (positions.getY(i) - minY) / spanY
    normal.fromBufferAttribute(normals, i)
    const shade = AMBIENT + (1 - AMBIENT) * Math.max(0, normal.dot(LIGHT_DIRECTION))
    color.lerpColors(bottomColor, topColor, t).multiplyScalar(shade)
    color.toArray(colors, i * 3)
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3))
}

export function paint(bottom: ColorRepresentation, top: ColorRepresentation = bottom) {
  return (geometry: BufferGeometry | null) => {
    if (geometry) paintVertexColors(geometry, bottom, top)
  }
}
