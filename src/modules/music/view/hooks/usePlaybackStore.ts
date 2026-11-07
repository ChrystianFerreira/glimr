import { create } from 'zustand'
import type { Cd } from '../../shared/types/cd'
import { type AudioElementLike, createAudioController } from '../utils/audioController'

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'error'

type PlaybackStore = {
  status: PlaybackStatus
  current: Cd | null
  inTray: string | null
  errorMessage: string | null
  select: (cd: Cd) => void
  togglePlay: () => void
  stop: () => void
}

/**
 * @example
 * const store = createPlaybackStore(() => new FakeAudioElement())
 * store.getState().select(cd)
 */
export function createPlaybackStore(createElement?: () => AudioElementLike) {
  return create<PlaybackStore>()((set, get) => {
    const audio = createAudioController({
      createElement,
      onEnded: () => set({ status: 'stopped' }),
      onError: () =>
        set((state) => ({
          status: 'error',
          inTray: null,
          errorMessage: state.current ? `Couldn't play ${state.current.title}` : null,
        })),
    })

    const togglePlay = () => {
      const { status } = get()
      if (status === 'playing') {
        audio.pause()
        set({ status: 'paused' })
      } else if (status === 'paused') {
        audio.resume()
        set({ status: 'playing' })
      } else if (status === 'stopped') {
        audio.restart()
        set({ status: 'playing' })
      }
    }

    return {
      status: 'idle',
      current: null,
      inTray: null,
      errorMessage: null,
      select: (cd) => {
        if (get().inTray === cd.id) {
          togglePlay()
          return
        }
        audio.play(cd.audio)
        set({ status: 'playing', current: cd, inTray: cd.id, errorMessage: null })
      },
      togglePlay,
      stop: () => {
        const { status } = get()
        if (status !== 'playing' && status !== 'paused') return
        audio.stop()
        set({ status: 'stopped' })
      },
    }
  })
}

export const usePlaybackStore = createPlaybackStore()
