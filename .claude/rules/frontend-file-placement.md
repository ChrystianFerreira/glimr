---
paths:
    - "src/**/*.{ts,tsx}"
---

# Where new front-end files go

New files go in `src/modules/`, following the layout below. Only the entry files (`main.tsx`, `App.tsx`, `index.css`) sit directly in `src/`.

There are three tiers of scope. A new file goes in the tier for what it's written for, and other pages and domains import it from there:

| Tier                       | Holds what's written for                 | Example                                      |
| -------------------------- | ---------------------------------------- | -------------------------------------------- |
| `modules/<domain>/<page>/` | one page                                 | `modules/room/view/components/RoomScene.tsx` |
| `modules/<domain>/shared/` | two or more pages of that domain         | `modules/room/shared/utils/roomSchema.ts`    |
| `modules/common/`          | any domain: render helpers, textures, UI | `modules/common/utils/renderScale.ts`        |

The domains so far are `room` and `music`. Add a domain only for a new kind of content with its own data and state.

Inside its tier, a file goes in the role folder for its kind, even when a single component uses it. Every tier has the same role folders, created only when they have files:

```text
<tier>/
├── components/     # components, and the contexts they provide
├── hooks/
├── types/
└── utils/          # functions that aren't components or hooks
```

A role folder says what kind of code a file holds, not how widely it's shared; the tier already says that. `utils/` takes any function that isn't a component or a hook, however domain-specific it is (`room/view/utils/focusPoses.ts` is a room-view function). A helper used by only one file stays private in that file. Once a second file imports it, it moves to its tier's role folder.

## Imports run one way

`room` → `music` → `common`. A domain imports from the ones to its right, never to its left.

-   `music` gets what it needs from `room` as props (the CDs, whether the shelf is interactive, a focus callback, the tray position). It never imports room's store, components or types.
-   `common` imports from no domain.
-   When `room` data contains a `music` shape, the `music` schema owns it and the `room` schema composes it.

## Naming and grouping

1. **Name page folders after the app's screens.** The only screen so far is `view/`, the room. A domain that renders on that screen uses `view/` too (`music/view/`). Components a screen renders as its root end in `Page` (`RoomViewPage`).
2. **Inside `components/`, group files in subfolders named after the area of the screen they belong to** once a page has named areas.
    -   A file that several areas use goes in the area it belongs to.
    -   The root of `components/` holds the page component, what it renders outside any area, and what belongs to no single area.
    -   A page with no named areas keeps `components/` flat.
3. **A component, or a feature made of several components, can get a folder named after it** that holds its components, their tests and any context it provides (`CdShelf/` for `CdShelf.tsx` and `CdCase.tsx`). Without a folder, a component is a plain file with its test and any stylesheet next to it.
4. **Several `utils/` files for one feature can share a subfolder named after it.** Each file keeps its full name inside it (`audio/audioController.ts`, not `audio/controller.ts`), so the name stays clear when mentioned on its own.
5. **Name a file after what it holds** (`RoomScene.tsx`, `usePlaybackStore.ts`, `loadCover.ts`, `types/room.ts`). Hooks start with `use`.
6. **Tests sit next to the file they test** (`modules/music/view/hooks/usePlaybackStore.test.ts`).
