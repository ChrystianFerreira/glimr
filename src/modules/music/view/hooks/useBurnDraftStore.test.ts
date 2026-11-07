import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BurnedCdShelfFullError, burnedCdStore } from '../utils/burnedCdStore'
import { probeAudio } from '../utils/probeAudio'
import { readAudioTags } from '../utils/readAudioTags'
import { useBurnDraftStore } from './useBurnDraftStore'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn<() => Promise<void>>() }))

vi.mock('../utils/probeAudio', () => ({ probeAudio: vi.fn() }))
vi.mock('../utils/readAudioTags', () => ({ readAudioTags: vi.fn() }))
vi.mock('../utils/burnedCdStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/burnedCdStore')>()),
  burnedCdStore: { add: vi.fn() },
}))
vi.mock('./useBurnedCdsStore', () => ({ useBurnedCdsStore: { getState: () => ({ refresh }) } }))
vi.mock('../../../common/utils/retroTexture', () => ({
  downscaleImage: () => ({ toBlob: (done: (blob: Blob) => void) => done(new Blob(['cover'], { type: 'image/png' })) }),
}))

const probe = vi.mocked(probeAudio)
const tags = vi.mocked(readAudioTags)
const add = vi.mocked(burnedCdStore.add)
const decode = vi.fn<(file: File) => Promise<ImageBitmap>>()

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function audioFile(name: string) {
  return new File([name], name, { type: 'audio/mpeg' })
}

function bitmap() {
  return { width: 512, height: 512, close: vi.fn() } as unknown as ImageBitmap
}

const draft = () => useBurnDraftStore.getState()

async function pickPlayable(file: File, title = 'Tag Title', artist = 'Tag Artist') {
  probe.mockResolvedValueOnce(true)
  tags.mockResolvedValueOnce({ title, artist })
  await draft().pickAudio(file)
}

beforeEach(() => {
  useBurnDraftStore.setState(useBurnDraftStore.getInitialState(), true)
  vi.clearAllMocks()
  refresh.mockResolvedValue(undefined)
  add.mockResolvedValue(undefined as never)
  vi.stubGlobal('createImageBitmap', decode)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useBurnDraftStore', () => {
  it('ignores an older audio pick that finishes after a newer one', async () => {
    const older = deferred<boolean>()
    const newer = deferred<boolean>()
    probe.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
    tags.mockResolvedValue({ title: 'Newer', artist: 'B' })
    const first = audioFile('older.mp3')
    const second = audioFile('newer.mp3')

    const olderPick = draft().pickAudio(first)
    const newerPick = draft().pickAudio(second)
    newer.resolve(true)
    await newerPick
    older.resolve(true)
    await olderPick

    expect(draft()).toMatchObject({ audio: second, title: 'Newer', artist: 'B', status: { kind: 'idle' } })
    expect(tags).toHaveBeenCalledTimes(1)
    expect(tags).toHaveBeenCalledWith(second)
  })

  it('ignores tags from an older audio pick that arrive after a newer pick started', async () => {
    const olderTags = deferred<{ title: string; artist: string }>()
    probe.mockResolvedValue(true)
    tags.mockReturnValueOnce(olderTags.promise).mockResolvedValueOnce({ title: 'Newer', artist: 'B' })
    const second = audioFile('newer.mp3')

    const olderPick = draft().pickAudio(audioFile('older.mp3'))
    await vi.waitFor(() => expect(tags).toHaveBeenCalledTimes(1))
    await draft().pickAudio(second)
    olderTags.resolve({ title: 'Older', artist: 'A' })
    await olderPick

    expect(draft()).toMatchObject({ audio: second, title: 'Newer', artist: 'B' })
  })

  it('keeps edited fields when tags arrive, and a re-pick refills only fields not edited since the last pick', async () => {
    draft().setTitle('My title')
    await pickPlayable(audioFile('one.mp3'), 'Tag One', 'Band One')

    expect(draft()).toMatchObject({ title: 'My title', artist: 'Band One' })

    draft().setArtist('My artist')
    await pickPlayable(audioFile('two.mp3'), 'Tag Two', 'Band Two')

    expect(draft()).toMatchObject({ title: 'Tag Two', artist: 'My artist', edited: { title: false, artist: false } })
  })

  it('reports an unplayable file as an audio error and keeps no audio', async () => {
    probe.mockResolvedValueOnce(false)

    await draft().pickAudio(audioFile('broken.mp3'))

    expect(draft().audio).toBeNull()
    expect(draft().status).toMatchObject({ kind: 'error', reason: 'audio' })
    expect(tags).not.toHaveBeenCalled()
  })

  it('reports a cover that fails to decode as a cover error, clears the cover, and still burns', async () => {
    const previous = bitmap()
    decode.mockResolvedValueOnce(previous).mockRejectedValueOnce(new Error('bad image'))
    await pickPlayable(audioFile('song.mp3'))
    await draft().pickCover(new File(['ok'], 'ok.png'))

    await draft().pickCover(new File(['bad'], 'bad.png'))

    expect(draft().cover).toBeNull()
    expect(previous.close).toHaveBeenCalled()
    expect(draft().status).toMatchObject({ kind: 'error', reason: 'cover' })

    await draft().burn(0)

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ cover: null }), 0)
    expect(draft().status).toEqual({ kind: 'burned', title: 'Tag Title' })
  })

  it('reports a full shelf and keeps the draft', async () => {
    const file = audioFile('song.mp3')
    await pickPlayable(file)
    add.mockRejectedValueOnce(new BurnedCdShelfFullError())

    await draft().burn(3)

    expect(draft()).toMatchObject({ audio: file, title: 'Tag Title', artist: 'Tag Artist' })
    expect(draft().status).toMatchObject({ kind: 'error', reason: 'full' })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('reports any other burn failure as a save error and keeps the draft', async () => {
    const file = audioFile('song.mp3')
    await pickPlayable(file)
    add.mockRejectedValueOnce(new Error('quota'))

    await draft().burn(0)

    expect(draft()).toMatchObject({ audio: file, title: 'Tag Title', artist: 'Tag Artist' })
    expect(draft().status).toMatchObject({ kind: 'error', reason: 'save' })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('burns the trimmed draft with its cover, refreshes the burned CDs, then resets the draft', async () => {
    const file = audioFile('song.mp3')
    const image = bitmap()
    decode.mockResolvedValueOnce(image)
    await pickPlayable(file)
    await draft().pickCover(new File(['ok'], 'ok.png'))
    draft().setTitle('  Rainy Day  ')
    draft().setArtist(' Me ')

    await draft().burn(2)

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Rainy Day', artist: 'Me', fileName: 'song.mp3', audio: file, cover: expect.any(Blob) }),
      2,
    )
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(add.mock.invocationCallOrder[0]).toBeLessThan(refresh.mock.invocationCallOrder[0] ?? 0)
    expect(image.close).toHaveBeenCalled()
    expect(draft()).toMatchObject({
      audio: null,
      cover: null,
      title: '',
      artist: '',
      edited: { title: false, artist: false },
      status: { kind: 'burned', title: 'Rainy Day' },
    })
  })

  it('does nothing while the audio is still being checked', async () => {
    const pending = deferred<{ title: string; artist: string }>()
    probe.mockResolvedValueOnce(true)
    tags.mockReturnValueOnce(pending.promise)
    draft().setTitle('Mine')
    const pick = draft().pickAudio(audioFile('song.mp3'))
    await vi.waitFor(() => expect(draft().audio).not.toBeNull())

    await draft().burn(0)

    expect(draft().status).toEqual({ kind: 'checking' })
    expect(add).not.toHaveBeenCalled()
    pending.resolve({ title: 'Tag', artist: '' })
    await pick
  })

  it('does nothing while a burn is already in flight', async () => {
    const saving = deferred<never>()
    await pickPlayable(audioFile('song.mp3'))
    add.mockReturnValueOnce(saving.promise)

    const first = draft().burn(0)
    await vi.waitFor(() => expect(add).toHaveBeenCalledTimes(1))
    await draft().burn(0)

    expect(add).toHaveBeenCalledTimes(1)
    expect(draft().status).toEqual({ kind: 'burning' })
    saving.resolve(undefined as never)
    await first
  })

  it('does nothing when the title is only whitespace', async () => {
    await pickPlayable(audioFile('song.mp3'))
    draft().setTitle('   ')

    await draft().burn(0)

    expect(add).not.toHaveBeenCalled()
    expect(draft().status).toEqual({ kind: 'idle' })
  })
})
