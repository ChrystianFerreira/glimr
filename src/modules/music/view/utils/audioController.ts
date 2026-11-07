export type AudioEventType = 'ended' | 'error' | 'pause' | 'playing'

export type AudioElementLike = {
  src: string
  currentTime: number
  readonly paused: boolean
  readonly ended: boolean
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
  onExternalPause: () => void
  onExternalPlay: () => void
  createElement?: () => AudioElementLike
}

type AudioController = {
  play: (src: string) => void
  resume: () => void
  restart: () => void
  pause: () => void
  stop: () => void
  unload: () => void
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
 * const audio = createAudioController({ onEnded, onError, onExternalPause, onExternalPlay })
 * audio.play('/media/song.mp3') // inside the click handler, before any await
 */
export function createAudioController({
  onEnded,
  onError,
  onExternalPause,
  onExternalPlay,
  createElement = () => new Audio(),
}: AudioControllerOptions): AudioController {
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
      // The element pauses itself right before 'ended', and events land after state changes, so check its live state.
      const paused = () => {
        if (loadToken === token && target.paused && !target.ended) onExternalPause()
      }
      const playing = () => {
        if (loadToken === token && !target.paused) onExternalPlay()
      }
      target.addEventListener('ended', ended)
      target.addEventListener('error', failed)
      target.addEventListener('pause', paused)
      target.addEventListener('playing', playing)
      detach = () => {
        target.removeEventListener('ended', ended)
        target.removeEventListener('error', failed)
        target.removeEventListener('pause', paused)
        target.removeEventListener('playing', playing)
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
    unload() {
      token++
      detach()
      detach = () => {}
      if (element) {
        element.pause()
        element.removeAttribute('src')
        element.load()
      }
    },
    dispose() {
      controller.unload()
      if (live === controller) setLive(null)
    },
  }

  setLive(controller)
  return controller
}
