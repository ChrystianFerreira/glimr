import { vi } from 'vitest'
import type { AudioElementLike, AudioEventType } from './audioController'

type Listener = () => void

/**
 * A stand-in for `HTMLAudioElement` in Vitest's node environment.
 * @example
 * const element = new FakeAudioElement()
 * element.nextPlay = () => Promise.reject(new DOMException('', 'NotAllowedError'))
 * element.finish()
 */
export class FakeAudioElement implements AudioElementLike {
  currentTime = 0
  paused = true
  ended = false
  readonly srcHistory: string[] = []
  readonly listenerHistory: { type: AudioEventType; listener: Listener }[] = []
  nextPlay: () => Promise<void> = () => Promise.resolve()
  private source = ''
  private readonly listeners = new Map<AudioEventType, Set<Listener>>()

  readonly play = vi.fn(() => {
    const wasPaused = this.paused
    if (this.ended) this.currentTime = 0
    this.paused = false
    this.ended = false
    return this.nextPlay().then(() => {
      if (wasPaused && !this.paused) this.emit('playing')
    })
  })

  readonly pause = vi.fn(() => {
    if (this.paused) return
    this.paused = true
    this.emit('pause')
  })

  readonly load = vi.fn()

  get src() {
    return this.source
  }

  set src(value: string) {
    this.source = value
    this.paused = true
    this.ended = false
    this.srcHistory.push(value)
  }

  removeAttribute(name: string) {
    if (name === 'src') this.source = ''
  }

  addEventListener(type: AudioEventType, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
    this.listenerHistory.push({ type, listener })
  }

  removeEventListener(type: AudioEventType, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: AudioEventType) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener()
  }

  finish() {
    this.ended = true
    if (!this.paused) {
      this.paused = true
      this.emit('pause')
    }
    this.emit('ended')
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0)
  }
}
