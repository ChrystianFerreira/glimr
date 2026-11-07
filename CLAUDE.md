# glimr

Shareable 2000s-style 3D personal rooms. Milestone 1 is a local-only room with a CD shelf you can play music from.

## Commands

Node 22 (`.nvmrc`).

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Burned CDs are stored per browser origin, so open the app at `http://localhost:5173` (the dev server refuses to start on any other port).

## Stack

Vite + React 19 + React Compiler + React Three Fiber 9 + drei + zustand + zod + Vitest.

## Versioning

Semantic versioning (`MAJOR.MINOR.PATCH`), tracked in `package.json`. Pre-1.0, a new feature bumps MINOR and a fix bumps PATCH. Tag each release `vX.Y.Z`.

## Where things live

- Conventions: `.claude/rules/`
- three.js guidance: `.claude/skills/`
- Plans: `docs/plans/`
