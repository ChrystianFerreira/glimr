import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAudioController } from './audioController'
import { FakeAudioElement } from './fakeAudioElement'

afterEach(() => {
  vi.unstubAllGlobals()
})

function controllerWith(element: FakeAudioElement) {
  return createAudioController({ onEnded: vi.fn(), onError: vi.fn(), createElement: () => element })
}

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
    const controller = createAudioController({ onEnded, onError, createElement: () => element })
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
    const onError = vi.fn()
    const controller = createAudioController({ onEnded: vi.fn(), onError, createElement: () => element })

    controller.play('/media/a.mp3')
    await Promise.resolve()

    expect(onError).toHaveBeenCalledTimes(1)
  })
})
