import { create } from 'zustand'
import { downscaleImage } from '../../../common/utils/retroTexture'
import { BurnedCdShelfFullError, burnedCdStore } from '../utils/burnedCdStore'
import { probeAudio } from '../utils/probeAudio'
import { randomLightColor } from '../utils/randomLightColor'
import { readAudioTags } from '../utils/readAudioTags'
import { useBurnedCdsStore } from './useBurnedCdsStore'

export const BURN_TITLE_MAX = 60
export const BURN_ARTIST_MAX = 40

const COVER_MAX = 256
const UNPLAYABLE_MESSAGE = 'That file can’t be played in this browser.'
const COVER_ERROR_MESSAGE = 'That image can’t be used'
const SHELF_FULL_MESSAGE = 'Shelf full'
const SAVE_ERROR_MESSAGE = 'Couldn’t save this CD in this browser.'

export type BurnStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'burning' }
  | { kind: 'burned'; title: string }
  | { kind: 'error'; message: string }

type DraftCover = { name: string; image: ImageBitmap }

type BurnDraftStore = {
  audio: File | null
  cover: DraftCover | null
  title: string
  artist: string
  edited: { title: boolean; artist: boolean }
  status: BurnStatus
  pickAudio: (file: File) => Promise<void>
  pickCover: (file: File) => Promise<void>
  clearCover: () => void
  setTitle: (title: string) => void
  setArtist: (artist: string) => void
  burn: (roomCdCount: number) => Promise<void>
}

const EMPTY_DRAFT = {
  audio: null,
  cover: null,
  title: '',
  artist: '',
  edited: { title: false, artist: false },
}

function coverBlob(image: ImageBitmap) {
  return new Promise<Blob>((resolve, reject) => {
    downscaleImage(image, COVER_MAX).toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Cover encode failed'))))
  })
}

/**
 * The burn panel's draft, kept across leaving and re-entering the shelf until a burn succeeds.
 * @example
 * const burn = useBurnDraftStore((state) => state.burn)
 * void burn(roomCds.length)
 */
export const useBurnDraftStore = create<BurnDraftStore>()((set, get) => {
  let latestAudioPick = 0
  let latestCoverPick = 0

  return {
    ...EMPTY_DRAFT,
    status: { kind: 'idle' },
    pickAudio: async (file) => {
      const pick = ++latestAudioPick
      set({ audio: null, status: { kind: 'checking' } })
      const playable = await probeAudio(file)
      if (pick !== latestAudioPick) return
      if (!playable) {
        set({ status: { kind: 'error', message: UNPLAYABLE_MESSAGE } })
        return
      }
      set({ audio: file })
      const tags = await readAudioTags(file)
      if (pick !== latestAudioPick) return
      const { title, artist, edited } = get()
      set({
        title: edited.title ? title : tags.title.slice(0, BURN_TITLE_MAX),
        artist: edited.artist ? artist : tags.artist.slice(0, BURN_ARTIST_MAX),
        edited: { title: false, artist: false },
        status: { kind: 'idle' },
      })
    },
    pickCover: async (file) => {
      const pick = ++latestCoverPick
      const image = await createImageBitmap(file).catch(() => null)
      if (pick !== latestCoverPick) {
        image?.close()
        return
      }
      get().cover?.image.close()
      if (!image) {
        set({ cover: null, status: { kind: 'error', message: COVER_ERROR_MESSAGE } })
        return
      }
      const { status } = get()
      const clearsCoverError = status.kind === 'error' && status.message === COVER_ERROR_MESSAGE
      set({ cover: { name: file.name, image }, ...(clearsCoverError && { status: { kind: 'idle' } }) })
    },
    clearCover: () => {
      latestCoverPick++
      get().cover?.image.close()
      set({ cover: null })
    },
    setTitle: (title) => set((state) => ({ title, edited: { ...state.edited, title: true } })),
    setArtist: (artist) => set((state) => ({ artist, edited: { ...state.edited, artist: true } })),
    burn: async (roomCdCount) => {
      const { audio, cover, title, artist, status } = get()
      const trimmedTitle = title.trim()
      if (!audio || !trimmedTitle || status.kind === 'checking' || status.kind === 'burning') return
      set({ status: { kind: 'burning' } })
      try {
        await burnedCdStore.add(
          {
            title: trimmedTitle,
            artist: artist.trim(),
            fileName: audio.name,
            placeholderColor: randomLightColor(),
            audio,
            cover: cover ? await coverBlob(cover.image) : null,
          },
          roomCdCount,
        )
      } catch (error) {
        const message = error instanceof BurnedCdShelfFullError ? SHELF_FULL_MESSAGE : SAVE_ERROR_MESSAGE
        set({ status: { kind: 'error', message } })
        return
      }
      await useBurnedCdsStore.getState().refresh()
      latestAudioPick++
      latestCoverPick++
      get().cover?.image.close()
      set({ ...EMPTY_DRAFT, status: { kind: 'burned', title: trimmedTitle } })
    },
  }
})
