import { describe, expect, it } from 'vitest'
import { IDLE_PRESS, LONG_PRESS_MOVE_PX, type LongPressInput, type LongPressState, nextLongPress } from './longPress'

function run(inputs: LongPressInput[], start: LongPressState = IDLE_PRESS) {
  let state = start
  return inputs.map((input) => {
    const step = nextLongPress(state, input)
    state = step.state
    return step
  })
}

const touchDown: LongPressInput = { type: 'pointerDown', pointerType: 'touch', x: 100, y: 100 }

describe('nextLongPress', () => {
  it('treats a touch press released before the timer as a tap that opens no menu', () => {
    const [down, up] = run([touchDown, { type: 'pointerUp' }])

    expect(down?.effect).toEqual({ kind: 'startTimer' })
    expect(up?.effect).toEqual({ kind: 'cancelTimer' })
    expect(up?.state).toEqual(IDLE_PRESS)
  })

  it('opens the menu when the timer elapses and asks to swallow the release click', () => {
    const [, elapsed, up] = run([touchDown, { type: 'timerElapsed' }, { type: 'pointerUp' }])

    expect(elapsed?.effect).toEqual({ kind: 'openMenu', swallowClick: true })
    expect(up?.effect).toEqual({ kind: 'none' })
    expect(up?.state).toEqual(IDLE_PRESS)
  })

  it('keeps pressing through small finger jitter', () => {
    const [, move, elapsed] = run([
      touchDown,
      { type: 'pointerMove', x: 100 + LONG_PRESS_MOVE_PX - 1, y: 100 },
      { type: 'timerElapsed' },
    ])

    expect(move?.effect).toEqual({ kind: 'none' })
    expect(elapsed?.effect).toEqual({ kind: 'openMenu', swallowClick: true })
  })

  it('cancels with no menu and no tap when the press moves beyond the threshold', () => {
    const [, move, elapsed, up] = run([
      touchDown,
      { type: 'pointerMove', x: 100, y: 100 + LONG_PRESS_MOVE_PX + 1 },
      { type: 'timerElapsed' },
      { type: 'pointerUp' },
    ])

    expect(move?.effect).toEqual({ kind: 'cancelTimer' })
    expect(elapsed?.effect).toEqual({ kind: 'none' })
    expect(up?.effect).toEqual({ kind: 'none' })
    expect(up?.state).toEqual(IDLE_PRESS)
  })

  it('ignores a native contextmenu that arrives after the timer already opened the menu', () => {
    const [, elapsed, contextMenu] = run([touchDown, { type: 'timerElapsed' }, { type: 'contextMenu' }])

    expect(elapsed?.effect.kind).toBe('openMenu')
    expect(contextMenu?.effect).toEqual({ kind: 'none' })
  })

  it('opens the menu once when a native contextmenu beats the timer', () => {
    const [, contextMenu, elapsed] = run([touchDown, { type: 'contextMenu' }, { type: 'timerElapsed' }])

    expect(contextMenu?.effect).toEqual({ kind: 'openMenu', swallowClick: true })
    expect(elapsed?.effect).toEqual({ kind: 'none' })
  })

  it('opens the menu immediately on a mouse right-click, with no timer', () => {
    const [down, contextMenu] = run([
      { type: 'pointerDown', pointerType: 'mouse', x: 10, y: 10 },
      { type: 'contextMenu' },
    ])

    expect(down?.effect).toEqual({ kind: 'none' })
    expect(contextMenu?.effect).toEqual({ kind: 'openMenu', swallowClick: false })
  })
})
