import type { BurnedShelfCd, Cd, ShelfCd } from '../../../music/shared/types/cd'

export const SHELF_SLOTS = 12

/**
 * The shelf's CDs: the room file's first, then burned CDs oldest first, capped at the shelf's slots.
 * @example
 * const { cds, hiddenBurnedCount } = composeShelf(load.shelf, burned)
 */
export function composeShelf(roomCds: Cd[], burnedCds: BurnedShelfCd[]) {
  const fromRoom = roomCds.slice(0, SHELF_SLOTS).map((cd): ShelfCd => ({ ...cd, isBurned: false }))
  const burned = burnedCds.toSorted((a, b) => a.burnedAt - b.burnedAt)
  const shown = burned.slice(0, SHELF_SLOTS - fromRoom.length)
  return { cds: [...fromRoom, ...shown], hiddenBurnedCount: burned.length - shown.length }
}
