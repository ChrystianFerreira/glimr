import { SHELF_SLOTS } from '../../../music/shared/utils/shelfSlots'
import { useBurnedCdsStore } from '../../../music/view/hooks/useBurnedCdsStore'
import { composeShelf } from '../../shared/utils/composeShelf'
import { useRoomStore } from './useRoomStore'

export function useComposedShelf() {
  const load = useRoomStore((state) => state.load)
  const burned = useBurnedCdsStore((state) => state.burned)
  if (load.status !== 'loaded') return { cds: [], hiddenBurnedCount: 0, full: false }
  const { cds, hiddenBurnedCount } = composeShelf(load.shelf, burned)
  return { cds, hiddenBurnedCount, full: cds.length >= SHELF_SLOTS }
}
