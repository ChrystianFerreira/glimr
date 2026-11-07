import type { ChangeEvent, Ref } from 'react'
import { BURN_ARTIST_MAX, BURN_TITLE_MAX, type BurnStatus, useBurnDraftStore } from '../../hooks/useBurnDraftStore'

type BurnPanelProps = {
  shelfFull: boolean
  roomCdCount: number
  ref?: Ref<HTMLElement>
}

function pickedFile(event: ChangeEvent<HTMLInputElement>) {
  const file = event.currentTarget.files?.[0] ?? null
  event.currentTarget.value = ''
  return file
}

function statusText(status: BurnStatus) {
  switch (status.kind) {
    case 'idle':
      return ''
    case 'checking':
      return 'Checking file…'
    case 'burning':
      return 'Burning…'
    case 'burned':
      return `Burned: ${status.title}`
    case 'error':
      return status.message
  }
}

export function BurnPanel({ shelfFull, roomCdCount, ref }: BurnPanelProps) {
  const audio = useBurnDraftStore((state) => state.audio)
  const cover = useBurnDraftStore((state) => state.cover)
  const title = useBurnDraftStore((state) => state.title)
  const artist = useBurnDraftStore((state) => state.artist)
  const status = useBurnDraftStore((state) => state.status)
  const pickAudio = useBurnDraftStore((state) => state.pickAudio)
  const pickCover = useBurnDraftStore((state) => state.pickCover)
  const clearCover = useBurnDraftStore((state) => state.clearCover)
  const setTitle = useBurnDraftStore((state) => state.setTitle)
  const setArtist = useBurnDraftStore((state) => state.setArtist)
  const burn = useBurnDraftStore((state) => state.burn)

  const burning = status.kind === 'burning'
  const canBurn = !shelfFull && !burning && status.kind !== 'checking' && audio !== null && title.trim() !== ''

  const onAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = pickedFile(event)
    if (file) void pickAudio(file)
  }

  const onCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = pickedFile(event)
    if (file) void pickCover(file)
  }

  return (
    <section className="burn-panel" aria-labelledby="burn-panel-heading" ref={ref}>
      <h2 id="burn-panel-heading" className="burn-panel-heading">
        Burn a CD
      </h2>
      <fieldset className="burn-panel-body" disabled={burning}>
        <div className="burn-file-row">
          <label className="burn-file-button">
            Audio file…
            <input type="file" accept="audio/*" onChange={onAudioChange} />
          </label>
          <span className="burn-file-name">{audio?.name ?? 'None picked'}</span>
        </div>
        <div className="burn-file-row">
          <label className="burn-file-button">
            Cover (optional)…
            <input type="file" accept="image/*" onChange={onCoverChange} />
          </label>
          <span className="burn-file-name">{cover?.name ?? 'None'}</span>
          {cover && (
            <button type="button" className="burn-button" onClick={clearCover}>
              Clear
            </button>
          )}
        </div>
        <label className="burn-text-field">
          Title
          <input
            type="text"
            value={title}
            maxLength={BURN_TITLE_MAX}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </label>
        <label className="burn-text-field">
          Artist
          <input
            type="text"
            value={artist}
            maxLength={BURN_ARTIST_MAX}
            onChange={(event) => setArtist(event.currentTarget.value)}
          />
        </label>
        <div className="burn-actions">
          <button type="button" className="burn-button" disabled={!canBurn} onClick={() => void burn(roomCdCount)}>
            Burn
          </button>
          {shelfFull && <span className="burn-shelf-full">Shelf full</span>}
        </div>
        <p className="burn-status" role="status">
          {statusText(status)}
        </p>
      </fieldset>
    </section>
  )
}
