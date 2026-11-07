export type AudioEventType = 'ended' | 'error'

export type AudioElementLike = {
  src: string
  currentTime: number
  play(): Promise<void>
  pause(): void
  load(): void
  removeAttribute(name: string): void
  addEventListener(type: AudioEventType, listener: () => void): void
  removeEventListener(type: AudioEventType, listener: () => void): void
}

type AudioControllerOptions = {
  onEnded: () => void
  onError: () => void
  createElement?: () => AudioElementLike
}

type AudioController = {
  play: (src: string) => void
  resume: () => void
  restart: () => void
  pause: () => void
  stop: () => void
  dispose: () => void
}

// Vite re-runs this module on hot updates without calling its dispose, so the live controller survives in hot data.
let live: AudioController | null = import.meta.hot?.data.liveAudioController ?? null

function setLive(controller: AudioController | null) {
  live = controller
  if (import.meta.hot) import.meta.hot.data.liveAudioController = controller
}

function requestPlaybackSession() {
  const audioSession = (globalThis.navigator as { audioSession?: { type: string } } | undefined)?.audioSession
  if (audioSession) audioSession.type = 'playback'
}

/**
 * Owns the app's one audio element; creating a new controller disposes the previous one.
 * @example
 * const audio = createAudioController({ onEnded, onError })
 * audio.play('/media/song.mp3') // inside the click handler, before any await
 */
export function createAudioController({ onEnded, onError, createElement = () => new Audio() }: AudioControllerOptions): AudioController {
  live?.dispose()
  requestPlaybackSession()

  let element: AudioElementLike | null = null
  let token = 0
  let detach = () => {}

  const audio = () => (element ??= createElement())

  const start = (loadToken: number) => {
    audio()
      .play()
      .catch((error: unknown) => {
        // A pause or a new load rejects the pending play() with AbortError; that isn't a playback failure.
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (loadToken === token) onError()
      })
  }

  const controller: AudioController = {
    play(src: string) {
      const loadToken = ++token
      const target = audio()
      detach()
      const ended = () => {
        if (loadToken === token) onEnded()
      }
      const failed = () => {
        if (loadToken === token) onError()
      }
      target.addEventListener('ended', ended)
      target.addEventListener('error', failed)
      detach = () => {
        target.removeEventListener('ended', ended)
        target.removeEventListener('error', failed)
      }
      target.src = src
      start(loadToken)
    },
    resume() {
      start(token)
    },
    restart() {
      audio().currentTime = 0
      start(token)
    },
    pause() {
      element?.pause()
    },
    stop() {
      if (!element) return
      element.pause()
      element.currentTime = 0
    },
    dispose() {
      token++
      detach()
      if (element) {
        element.pause()
        element.removeAttribute('src')
        element.load()
      }
      if (live === controller) setLive(null)
    },
  }

  setLive(controller)
  return controller
}
