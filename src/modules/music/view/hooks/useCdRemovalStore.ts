import { create } from 'zustand'
import type { BurnedShelfCd } from '../../shared/types/cd'
import { useBurnedCdsStore } from './useBurnedCdsStore'

type CdRemovalStore = {
  menu: { cd: BurnedShelfCd; x: number; y: number } | null
  confirming: BurnedShelfCd | null
  error: string | null
  openMenu: (cd: BurnedShelfCd, x: number, y: number) => void
  closeMenu: () => void
  ask: (cd: BurnedShelfCd) => void
  cancel: () => void
  confirm: () => Promise<void>
}

export const useCdRemovalStore = create<CdRemovalStore>()((set, get) => ({
  menu: null,
  confirming: null,
  error: null,
  openMenu: (cd, x, y) => set({ menu: { cd, x, y } }),
  closeMenu: () => set({ menu: null }),
  ask: (cd) => set({ menu: null, confirming: cd, error: null }),
  cancel: () => set({ confirming: null, error: null }),
  confirm: async () => {
    const cd = get().confirming
    if (!cd) return
    try {
      await useBurnedCdsStore.getState().remove(cd.id)
      if (get().confirming === cd) set({ confirming: null, error: null })
    } catch (error) {
      console.error('Couldn’t remove the burned CD:', error)
      if (get().confirming === cd) set({ error: `Couldn’t remove ${cd.title}. Try again.` })
    }
  },
}))
