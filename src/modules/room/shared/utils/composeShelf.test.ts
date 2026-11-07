import { describe, expect, it } from 'vitest'
import type { BurnedShelfCd, Cd } from '../../../music/shared/types/cd'
import { composeShelf } from './composeShelf'

function fileCds(count: number): Cd[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `file-${index}`,
    title: `File ${index}`,
    artist: 'glimr',
    cover: `/covers/${index}.png`,
    audio: `/media/${index}.wav`,
  }))
}

function burnedCd(index: number): BurnedShelfCd {
  return {
    isBurned: true,
    id: `burned-${index}`,
    title: `Burned ${index}`,
    artist: '',
    audio: `blob:audio-${index}`,
    cover: null,
    placeholderColor: '#f4e1c1',
    burnedAt: 1000 + index,
  }
}

const ids = (cds: { id: string }[]) => cds.map((cd) => cd.id)

describe('composeShelf', () => {
  it('puts 4 file CDs first, then 3 burned CDs oldest first', () => {
    const burned = [burnedCd(2), burnedCd(0), burnedCd(1)]

    const { cds, hiddenBurnedCount } = composeShelf(fileCds(4), burned)

    expect(ids(cds)).toEqual(['file-0', 'file-1', 'file-2', 'file-3', 'burned-0', 'burned-1', 'burned-2'])
    expect(cds.map((cd) => cd.isBurned)).toEqual([false, false, false, false, true, true, true])
    expect(hiddenBurnedCount).toBe(0)
  })

  it('caps 4 file CDs and 9 burned CDs at 12 and reports the newest burned CD as hidden', () => {
    const burned = Array.from({ length: 9 }, (_, index) => burnedCd(index))

    const { cds, hiddenBurnedCount } = composeShelf(fileCds(4), burned)

    expect(cds).toHaveLength(12)
    expect(cds.at(-1)?.id).toBe('burned-7')
    expect(hiddenBurnedCount).toBe(1)
  })

  it('slides the third burned CD into the second one’s slot when the second is removed', () => {
    const before = composeShelf(fileCds(4), [burnedCd(0), burnedCd(1), burnedCd(2)]).cds
    const secondSlot = ids(before).indexOf('burned-1')

    const after = composeShelf(fileCds(4), [burnedCd(0), burnedCd(2)]).cds

    expect(ids(after).indexOf('burned-2')).toBe(secondSlot)
    expect(after).toHaveLength(6)
  })

  it('keeps file CDs exactly as the room file lists them', () => {
    const files = fileCds(2)

    const { cds } = composeShelf(files, [])

    expect(cds).toEqual(files.map((cd) => ({ ...cd, isBurned: false })))
  })
})
