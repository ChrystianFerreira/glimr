---
paths:
    - "src/**/*.{ts,tsx}"
---

# Effects in React code

An Effect (`useEffect`, `useLayoutEffect`) is for keeping a component in sync with something outside React: the network, a browser API, a timer, an audio element, a non-React widget. Everything else is computed during render or done in an event handler.

The app runs React 19 with the React Compiler, which memoizes components and hooks for you.

## Before writing an Effect, ask why the code runs

-   **The user did something** (clicked, typed, submitted, opened a menu): it goes in that event's handler.
-   **It can be worked out from props or state:** compute it during render.
-   **The component is on screen and has to stay in sync with something outside React:** that is an Effect.

## Instead of an Effect

| Instead of an Effect that...                                                     | Do this                                                                                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| copies a prop, loaded data, or a value computed from them into state             | Use the value directly or compute it during render. The compiler memoizes it; don't add `useMemo`.               |
| seeds an editable draft from a prop or loaded data                               | Keep only the edits in state and show `draft ?? value`, or make the component controlled (`value` + `onChange`). |
| resets all of a component's state when a prop changes                            | Render the component with that prop as its `key`.                                                                |
| resets part of the state when a prop changes                                     | Store an id and look the object up during render, or reset in the handler that changes the prop.                 |
| runs a request, sound or camera move because state a user action set changed     | Do it in that action's handler.                                                                                  |
| sets state that another Effect reacts to                                         | Compute the whole next state in one handler, and derive the rest during render.                                  |
| calls a parent's `onChange` after local state changes                            | Call it in the same handler that sets the state, or make the component controlled.                               |
| fetches data for a parent                                                        | Fetch in the parent and pass the data down.                                                                      |
| copies a browser or external store into state                                    | `useSyncExternalStore`, or the store's own hook (zustand).                                                       |
| does DOM work when an element appears                                            | A ref callback (see "Refs and the DOM").                                                                         |

## Still an Effect

-   Subscriptions, connections, listeners and timers, with a cleanup that undoes the setup.
-   Work that happens because the component was displayed, such as a "page viewed" event.
-   Data that has to follow what is shown. Prefer a data-fetching hook or React 19's `use()` with a cached promise over a fetch inside an Effect. When a hand-written fetch can't be avoided, ignore stale responses in the cleanup.
-   Logic inside an Effect that reads the latest props or state but shouldn't re-run the Effect goes in a `useEffectEvent`. Never suppress `exhaustive-deps` to get the same result.

## Memoization

-   Don't write `useMemo`, `useCallback` or `memo` by hand. The compiler does it. Use one only as an escape hatch for a measured problem the compiler doesn't solve.
-   Never suppress `exhaustive-deps`.

## Refs and the DOM

-   Read and write refs in event handlers, Effects and ref callbacks, never during render.
-   When the element is already rendered, do the DOM work (focus, scroll, measure) in the event handler.
-   To act on an element when it appears, pass a ref callback. It may return a cleanup function, which React calls when the element goes away. Don't wrap it in `useCallback` to keep it stable; the compiler handles that.
-   `flushSync` a state update only when the same handler must act on the element that update renders and a ref callback doesn't fit.

## React Three Fiber

-   Never set React state inside `useFrame`. Mutate refs and three.js objects there instead.

Source: react.dev, "You Might Not Need an Effect".
