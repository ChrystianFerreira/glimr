import { useCdRemovalStore } from '../hooks/useCdRemovalStore'
import { usePlaybackStore } from '../hooks/usePlaybackStore'

export function NowPlayingStrip() {
  const status = usePlaybackStore((state) => state.status)
  const current = usePlaybackStore((state) => state.current)
  const errorMessage = usePlaybackStore((state) => state.errorMessage)
  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const stop = usePlaybackStore((state) => state.stop)
  const ask = useCdRemovalStore((state) => state.ask)

  if (status === 'idle' || !current) return null

  const removeButton = current.isBurned && (
    <button type="button" onClick={() => ask(current)}>
      Remove from shelf
    </button>
  )

  if (status === 'error') {
    return (
      <div className="now-playing now-playing-error">
        <span role="alert">{errorMessage}</span>
        {removeButton}
      </div>
    )
  }

  const playing = status === 'playing'
  return (
    <div className="now-playing" aria-live="polite">
      <span className="now-playing-title">{current.artist ? `${current.title} — ${current.artist}` : current.title}</span>
      <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button type="button" onClick={stop} disabled={status === 'stopped'} aria-label="Stop">
        ■
      </button>
      {removeButton}
    </div>
  )
}
