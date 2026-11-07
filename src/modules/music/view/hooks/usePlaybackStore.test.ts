import { beforeEach, describe, expect, it } from 'vitest'
import type { BurnedShelfCd, ShelfCd } from '../../shared/types/cd'
import { FakeAudioElement } from '../utils/fakeAudioElement'
import { createPlaybackStore } from './usePlaybackStore'

const cdA: ShelfCd = { isBurned: false, id: 'a', title: 'Track A', artist: 'Artist A', cover: '/a.png', audio: '/media/a.mp3' }
const cdB: ShelfCd = { isBurned: false, id: 'b', title: 'Track B', artist: 'Artist B', cover: '/b.png', audio: '/media/b%20b.mp3' }
const burned: BurnedShelfCd = {
  isBurned: true,
  id: 'burned-1',
  title: 'Mine',
  artist: '',
  audio: 'blob:http://localhost:5173/1',
  cover: null,
  placeholderColor: '#f4e1c1',
  burnedAt: 1,
}

let element: FakeAudioElement
let store: ReturnType<typeof createPlaybackStore>

beforeEach(() => {
  element = new FakeAudioElement()
  store = createPlaybackStore(() => element)
})

const flushPlay = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('playback', () => {
  it('plays a CD from idle', () => {
    store.getState().select(cdA)

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdA, inTray: 'a' })
    expect(element.src).toBe('/media/a.mp3')
    expect(element.play).toHaveBeenCalledTimes(1)
  })

  it('pauses when the playing CD is selected again', () => {
    store.getState().select(cdA)

    store.getState().select(cdA)

    expect(store.getState().status).toBe('paused')
    expect(element.pause).toHaveBeenCalled()
  })

  it('resumes a paused CD without reloading its source', () => {
    store.getState().select(cdA)
    store.getState().select(cdA)

    store.getState().select(cdA)

    expect(store.getState().status).toBe('playing')
    expect(element.play).toHaveBeenCalledTimes(2)
    expect(element.srcHistory).toEqual(['/media/a.mp3'])
  })

  it('swaps to another CD', () => {
    store.getState().select(cdA)

    store.getState().select(cdB)

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdB, inTray: 'b' })
    expect(element.src).toBe('/media/b%20b.mp3')
  })

  it('stops at the end of the track and keeps the CD in the tray', async () => {
    store.getState().select(cdA)
    await flushPlay()

    element.finish()

    expect(store.getState()).toMatchObject({ status: 'stopped', current: cdA, inTray: 'a' })
  })

  it("returns the CD to the shelf and says it couldn't play on a load error", () => {
    store.getState().select(cdA)

    element.emit('error')

    expect(store.getState()).toMatchObject({ status: 'error', inTray: null, errorMessage: "Couldn't play Track A" })
  })

  it('recovers from an error when another CD is selected', () => {
    store.getState().select(cdA)
    element.emit('error')

    store.getState().select(cdB)

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdB, inTray: 'b', errorMessage: null })
  })

  it('stops from paused and resets the playback position', () => {
    store.getState().select(cdA)
    store.getState().select(cdA)
    element.currentTime = 1.5

    store.getState().stop()

    expect(store.getState()).toMatchObject({ status: 'stopped', inTray: 'a' })
    expect(element.currentTime).toBe(0)
  })

  it('ignores a late ended event from the previous load after a swap', () => {
    store.getState().select(cdA)
    const firstLoadListeners = element.listenerHistory.filter(({ type }) => type === 'ended')

    store.getState().select(cdB)
    for (const { listener } of firstLoadListeners) listener()

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdB, inTray: 'b' })
  })

  it('moves to error when play() is not allowed', async () => {
    element.nextPlay = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))

    store.getState().select(cdA)
    await flushPlay()

    expect(store.getState()).toMatchObject({ status: 'error', inTray: null, errorMessage: "Couldn't play Track A" })
  })

  it('stays paused when pausing interrupts a pending play()', async () => {
    element.nextPlay = () => Promise.reject(new DOMException('Interrupted', 'AbortError'))

    store.getState().select(cdA)
    store.getState().select(cdA)
    await flushPlay()

    expect(store.getState()).toMatchObject({ status: 'paused', inTray: 'a' })
  })

  it('replays the tray CD from the start when stopped', () => {
    store.getState().select(cdA)
    element.currentTime = 2.4
    element.finish()

    store.getState().select(cdA)

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdA, inTray: 'a' })
    expect(element.currentTime).toBe(0)
    expect(element.play).toHaveBeenCalledTimes(2)
    expect(element.srcHistory).toEqual(['/media/a.mp3'])
  })
})

describe('playback controlled from outside the app', () => {
  const recordStatuses = () => {
    const statuses: string[] = []
    store.subscribe((state, previous) => {
      if (state.status !== previous.status) statuses.push(state.status)
    })
    return statuses
  }

  it('shows paused when the system pauses the CD, and resumes on the next toggle', async () => {
    store.getState().select(cdA)
    await flushPlay()

    element.pause()
    expect(store.getState()).toMatchObject({ status: 'paused', inTray: 'a' })

    store.getState().togglePlay()
    expect(store.getState().status).toBe('playing')
    expect(element.paused).toBe(false)
  })

  it('shows playing when the system replays an ended CD, and Stop then stops it', async () => {
    store.getState().select(cdA)
    await flushPlay()
    element.finish()

    void element.play()
    await flushPlay()
    expect(store.getState()).toMatchObject({ status: 'playing', current: cdA, inTray: 'a' })

    store.getState().stop()
    expect(store.getState().status).toBe('stopped')
    expect(element.paused).toBe(true)
  })

  it("moves straight to paused when the app's own toggle pauses", async () => {
    store.getState().select(cdA)
    await flushPlay()
    const statuses = recordStatuses()

    store.getState().togglePlay()

    expect(statuses).toEqual(['paused'])
  })

  it("moves straight to stopped when the app's own Stop is pressed", async () => {
    store.getState().select(cdA)
    await flushPlay()
    const statuses = recordStatuses()

    store.getState().stop()

    expect(statuses).toEqual(['stopped'])
    expect(store.getState().inTray).toBe('a')
  })

  it('moves straight to stopped at the end of the track, keeping the CD in the tray', async () => {
    store.getState().select(cdA)
    await flushPlay()
    const statuses = recordStatuses()

    element.finish()

    expect(statuses).toEqual(['stopped'])
    expect(store.getState()).toMatchObject({ current: cdA, inTray: 'a' })
  })

  it('ignores pause and playing events from the previous load after a swap', async () => {
    store.getState().select(cdA)
    await flushPlay()
    const firstLoadListeners = element.listenerHistory.filter(({ type }) => type === 'pause' || type === 'playing')
    store.getState().select(cdB)
    await flushPlay()

    element.paused = true
    for (const { listener } of firstLoadListeners) listener()

    expect(store.getState()).toMatchObject({ status: 'playing', current: cdB, inTray: 'b' })
  })
})

describe('eject', () => {
  const cleared = { status: 'idle', current: null, inTray: null, errorMessage: null }

  const putInStatus = async (status: 'playing' | 'paused' | 'stopped' | 'error') => {
    store.getState().select(burned)
    await flushPlay()
    if (status === 'paused') store.getState().togglePlay()
    if (status === 'stopped') store.getState().stop()
    if (status === 'error') element.emit('error')
    expect(store.getState().status).toBe(status)
  }

  it.each(['playing', 'paused', 'stopped', 'error'] as const)(
    'clears the current CD and the tray when it is %s',
    async (status) => {
      await putInStatus(status)

      store.getState().eject(burned.id)

      expect(store.getState()).toMatchObject(cleared)
    },
  )

  it('changes nothing when another CD is current', async () => {
    store.getState().select(cdA)
    await flushPlay()
    const before = store.getState()

    store.getState().eject(burned.id)

    expect(store.getState()).toMatchObject({ status: before.status, current: cdA, inTray: 'a' })
    expect(element.src).toBe('/media/a.mp3')
    expect(element.paused).toBe(false)
  })

  it('lets go of the source, and a later play from outside the app changes nothing', async () => {
    store.getState().select(burned)
    await flushPlay()

    store.getState().eject(burned.id)
    expect(element.src).toBe('')
    expect(element.paused).toBe(true)
    expect(element.load).toHaveBeenCalled()

    void element.play()
    await flushPlay()
    element.finish()
    element.emit('error')

    expect(store.getState()).toMatchObject(cleared)
  })
})
