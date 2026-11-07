type Vec3 = [number, number, number]

export const CD_SHELF_SIZE = { width: 1.6, height: 1.9, depth: 0.3 }
export const CD_SHELF_PANEL = 0.04
export const CD_SHELF_ROW_FLOORS = [1.26, 0.68, 0.1]
export const CD_SHELF_COLUMNS = 4
export const CD_SHELF_BACK_INSET = 0.06

export const CD_CASE_SIZE = { width: 0.32, height: 0.28, thickness: 0.035 }
export const CD_CASE_LEAN = -0.12

const COLUMN_SPACING = 0.37

/**
 * Where a shelf slot's case stands, in the shelf's local space; slots fill rows top-left first.
 * @example
 * cdSlotPosition(0) // top row, left column
 * cdSlotPosition(11) // bottom row, right column
 */
export function cdSlotPosition(index: number): Vec3 {
  const column = index % CD_SHELF_COLUMNS
  const rowFloor = CD_SHELF_ROW_FLOORS[Math.floor(index / CD_SHELF_COLUMNS)] ?? 0
  const lean = Math.sin(-CD_CASE_LEAN) * (CD_CASE_SIZE.height / 2)
  return [
    (column - (CD_SHELF_COLUMNS - 1) / 2) * COLUMN_SPACING,
    rowFloor + (CD_CASE_SIZE.height / 2) * Math.cos(CD_CASE_LEAN),
    -CD_SHELF_SIZE.depth / 2 + CD_SHELF_BACK_INSET + CD_CASE_SIZE.thickness / 2 + lean,
  ]
}
