export const LONG_PRESS_MS = 500
export const LONG_PRESS_MOVE_PX = 10

export type LongPressState =
  | { kind: 'idle' }
  | { kind: 'pressing'; x: number; y: number }
  | { kind: 'cancelled' }
  | { kind: 'menuOpen' }

export type LongPressInput =
  | { type: 'pointerDown'; pointerType: string; x: number; y: number }
  | { type: 'pointerMove'; x: number; y: number }
  | { type: 'pointerUp' }
  | { type: 'timerElapsed' }
  | { type: 'contextMenu' }

export type LongPressEffect =
  | { kind: 'none' }
  | { kind: 'startTimer' }
  | { kind: 'cancelTimer' }
  | { kind: 'openMenu'; swallowClick: boolean }

export const IDLE_PRESS: LongPressState = { kind: 'idle' }

const NONE: LongPressEffect = { kind: 'none' }

/**
 * @example
 * const { state, effect } = nextLongPress(pressRef.current, { type: 'timerElapsed' })
 * if (effect.kind === 'openMenu' && effect.swallowClick) swallowNextClick()
 */
export function nextLongPress(state: LongPressState, input: LongPressInput): { state: LongPressState; effect: LongPressEffect } {
  switch (input.type) {
    case 'pointerDown':
      if (input.pointerType === 'mouse') return { state: IDLE_PRESS, effect: NONE }
      return { state: { kind: 'pressing', x: input.x, y: input.y }, effect: { kind: 'startTimer' } }
    case 'pointerMove':
      if (state.kind !== 'pressing') return { state, effect: NONE }
      if (Math.hypot(input.x - state.x, input.y - state.y) <= LONG_PRESS_MOVE_PX) return { state, effect: NONE }
      return { state: { kind: 'cancelled' }, effect: { kind: 'cancelTimer' } }
    case 'pointerUp':
      return { state: IDLE_PRESS, effect: state.kind === 'pressing' ? { kind: 'cancelTimer' } : NONE }
    case 'timerElapsed':
      if (state.kind !== 'pressing') return { state, effect: NONE }
      return { state: { kind: 'menuOpen' }, effect: { kind: 'openMenu', swallowClick: true } }
    case 'contextMenu':
      if (state.kind === 'menuOpen' || state.kind === 'cancelled') return { state, effect: NONE }
      if (state.kind === 'pressing') return { state: { kind: 'menuOpen' }, effect: { kind: 'openMenu', swallowClick: true } }
      return { state: IDLE_PRESS, effect: { kind: 'openMenu', swallowClick: false } }
  }
}
