import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoomStore } from './useRoomStore'

beforeEach(() => {
  useRoomStore.setState(useRoomStore.getInitialState(), true)
})

describe('room focus', () => {
  it('moves from overview to the shelf', () => {
    useRoomStore.getState().focus('shelf')

    expect(useRoomStore.getState().focused).toBe('shelf')
  })

  it('returns from the shelf to the overview on back', () => {
    useRoomStore.getState().focus('shelf')
    useRoomStore.getState().back()

    expect(useRoomStore.getState().focused).toBe('overview')
  })

  it('stays in the overview on back', () => {
    useRoomStore.getState().back()

    expect(useRoomStore.getState().focused).toBe('overview')
  })

  it('moves from the shelf straight to the stereo', () => {
    const visited: string[] = []
    useRoomStore.getState().focus('shelf')
    const unsubscribe = useRoomStore.subscribe((state) => visited.push(state.focused))

    useRoomStore.getState().focus('stereo')
    unsubscribe()

    expect(visited).toEqual(['stereo'])
  })

  it('leaves the state unchanged when focusing the current target', () => {
    useRoomStore.getState().focus('shelf')
    const listener = vi.fn()
    const unsubscribe = useRoomStore.subscribe(listener)

    useRoomStore.getState().focus('shelf')
    unsubscribe()

    expect(listener).not.toHaveBeenCalled()
    expect(useRoomStore.getState().focused).toBe('shelf')
  })
})
