import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAudioController } from './audioController'
import { FakeAudioElement } from './fakeAudioElement'

afterEach(() => {
  vi.unstubAllGlobals()
})

function controllerWith(element: FakeAudioElement) {
  return createAudioController({
    onEnded: vi.fn(),
    onError: vi.fn(),
    onExternalPause: vi.fn(),
    onExternalPlay: vi.fn(),
    createElement: () => element,
  })
}

function spiedController(element: FakeAudioElement) {
  const callbacks = { onEnded: vi.fn(), onError: vi.fn(), onExternalPause: vi.fn(), onExternalPlay: vi.fn() }
  return { ...callbacks, controller: createAudioController({ ...callbacks, createElement: () => element }) }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('audioController', () => {
  it('calls the element play() in the same call as play, with no await before it', () => {
    const element = new FakeAudioElement()
    const controller = controllerWith(element)

    controller.play('/media/a.mp3')

    expect(element.src).toBe('/media/a.mp3')
    expect(element.play).toHaveBeenCalledTimes(1)
  })

  it('leaves exactly one live element when created twice, with the first paused', () => {
    const first = new FakeAudioElement()
    const second = new FakeAudioElement()
    controllerWith(first).play('/media/a.mp3')

    controllerWith(second).play('/media/b.mp3')

    expect(first.paused).toBe(true)
    expect(first.src).toBe('')
    expect(first.listenerCount()).toBe(0)
    expect(second.paused).toBe(false)
    expect(second.src).toBe('/media/b.mp3')
  })

  it("doesn't throw when navigator.audioSession is undefined", () => {
    vi.stubGlobal('navigator', {})

    expect(() => controllerWith(new FakeAudioElement())).not.toThrow()
  })

  it('asks for the playback audio session when the browser has one', () => {
    const audioSession = { type: 'auto' }
    vi.stubGlobal('navigator', { audioSession })

    controllerWith(new FakeAudioElement())

    expect(audioSession.type).toBe('playback')
  })

  it("drops ended and error events from an earlier load", () => {
    const element = new FakeAudioElement()
    const onEnded = vi.fn()
    const onError = vi.fn()
    const controller = createAudioController({
      onEnded,
      onError,
      onExternalPause: vi.fn(),
      onExternalPlay: vi.fn(),
      createElement: () => element,
    })
    controller.play('/media/a.mp3')
    const firstLoadListeners = [...element.listenerHistory]

    controller.play('/media/b.mp3')
    for (const { listener } of firstLoadListeners) listener()

    expect(onEnded).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports a rejected play() as an error', async () => {
    const element = new FakeAudioElement()
    element.nextPlay = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))
    const { controller, onError } = spiedController(element)

    controller.play('/media/a.mp3')
    await flush()

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("ignores a rejected play() from an earlier load but reports the current load's", async () => {
    const element = new FakeAudioElement()
    const rejectPlay: ((error: unknown) => void)[] = []
    element.nextPlay = () => new Promise((_, reject) => rejectPlay.push(reject))
    const { controller, onError } = spiedController(element)
    controller.play('/media/a.mp3')
    controller.play('/media/b.mp3')

    rejectPlay[0](new DOMException('Unsupported', 'NotSupportedError'))
    await flush()
    expect(onError).not.toHaveBeenCalled()

    rejectPlay[1](new DOMException('Unsupported', 'NotSupportedError'))
    await flush()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reports a resume whose play() is not allowed as one error', async () => {
    const element = new FakeAudioElement()
    const { controller, onError } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()
    controller.pause()
    element.nextPlay = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))

    controller.resume()
    await flush()

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reports a restart whose play() is not allowed as one error', async () => {
    const element = new FakeAudioElement()
    const { controller, onError } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()
    element.finish()
    element.nextPlay = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))

    controller.restart()
    await flush()

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reports a pause it did not ask for', async () => {
    const element = new FakeAudioElement()
    const { controller, onExternalPause } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()

    element.pause()

    expect(onExternalPause).toHaveBeenCalledTimes(1)
  })

  it('does not report the pause that comes right before the end of the track', async () => {
    const element = new FakeAudioElement()
    const { controller, onEnded, onExternalPause } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()

    element.finish()

    expect(onExternalPause).not.toHaveBeenCalled()
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  it('reports a play it did not ask for after the track ended', async () => {
    const element = new FakeAudioElement()
    const { controller, onExternalPlay } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()
    element.finish()
    onExternalPlay.mockClear()

    void element.play()
    await flush()

    expect(onExternalPlay).toHaveBeenCalledTimes(1)
  })

  it('drops pause and playing events from an earlier load', async () => {
    const element = new FakeAudioElement()
    const { controller, onExternalPause, onExternalPlay } = spiedController(element)
    controller.play('/media/a.mp3')
    await flush()
    const firstLoadListeners = [...element.listenerHistory]
    controller.play('/media/b.mp3')
    await flush()
    onExternalPlay.mockClear()

    element.paused = true
    for (const { listener } of firstLoadListeners) listener()
    element.paused = false
    for (const { listener } of firstLoadListeners) listener()

    expect(onExternalPause).not.toHaveBeenCalled()
    expect(onExternalPlay).not.toHaveBeenCalled()
    element.pause()
    expect(onExternalPause).toHaveBeenCalledTimes(1)
  })

  it('unloads the source and stops reporting events until the next play', async () => {
    const element = new FakeAudioElement()
    const { controller, onEnded, onError, onExternalPause, onExternalPlay } = spiedController(element)
    controller.play('blob:http://localhost:5173/a')
    await flush()
    onExternalPlay.mockClear()

    controller.unload()

    expect(element.paused).toBe(true)
    expect(element.src).toBe('')
    expect(element.load).toHaveBeenCalledTimes(1)
    expect(element.listenerCount()).toBe(0)
    void element.play()
    await flush()
    element.finish()
    expect(onEnded).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(onExternalPause).not.toHaveBeenCalled()
    expect(onExternalPlay).not.toHaveBeenCalled()
  })

  it('ignores a play() rejection from the load it unloaded', async () => {
    const element = new FakeAudioElement()
    const rejectPlay: ((error: unknown) => void)[] = []
    element.nextPlay = () => new Promise((_, reject) => rejectPlay.push(reject))
    const { controller, onError } = spiedController(element)
    controller.play('/media/a.mp3')

    controller.unload()
    rejectPlay[0](new DOMException('Unsupported', 'NotSupportedError'))
    await flush()

    expect(onError).not.toHaveBeenCalled()
  })

  it('plays again normally after an unload', () => {
    const element = new FakeAudioElement()
    const controller = controllerWith(element)
    controller.play('/media/a.mp3')
    controller.unload()

    controller.play('/media/b.mp3')

    expect(element.src).toBe('/media/b.mp3')
    expect(element.paused).toBe(false)
  })
})
