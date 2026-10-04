# Toft — notes for AI assistants

Cosy 3D farming game. React Three Fiber + TypeScript + zustand + Vite. Design lives in `DESIGN.md`.

## Architecture rules
- **`src/game` is pure.** No React, Three.js, DOM, `Date.now()` or `Math.random()`. Time (`now`) and randomness (`roll`) are passed in. This keeps rules testable and lets a server run the same code for multiplayer.
- **All game state changes go through `applyAction(state, action, now)`**, reached from the app only via `useStore().dispatch(action)`. Actions must stay plain serialisable data.
- **Invalid actions return the same state object**, not an error.
- **Tuning goes in `src/game/config.ts`**, never hard-coded in rules or scene.
- **Per-frame animation uses `useFrame` and refs**, never React state, to avoid re-rendering 60×/s.
- UI that isn't game state (selected crop, animations) stays out of `GameState` and out of the save.
- Imports use explicit `.ts`/`.tsx` extensions.

## When changing rules
- Add or update tests in `src/game/*.test.ts` and run `npm test`.
- If an assumption is made where the design is unclear, add it to "Open questions" in `DESIGN.md`.
- Bump the `version` in the persist config in `src/state/store.ts` if `GameState` changes shape.

## Checks
`npm test` · `npm run typecheck` · `npm run build`
