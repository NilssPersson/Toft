# Toft — notes for AI assistants

Cosy 3D farming game. Astro site (static output) with the game on `/play`: React Three Fiber + TypeScript + zustand. Design lives in `DESIGN.md`.

## Site structure
- Routes live in `src/pages/`. `/play` mounts `src/Game.tsx` with `client:only="react"`; the game never renders on the server.
- **Game code stays on `/play`.** Never import `three`, `@react-three/*`, `src/state`, `src/scene`, `src/ui`, `App.tsx` or `Game.tsx` from any other page or from the layouts. Marketing pages ship no JS; check `dist/` after building if in doubt.
- Marketing pages use `src/layouts/Page.astro`; every page's `<head>` (title, description, Open Graph) comes from `src/layouts/Base.astro`.
- Blog posts are Markdown in `src/content/blog/`, schema in `src/content.config.ts`.
- Site constants (name, public URL, contact) are in `src/site/config.ts`.

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
`npm test` · `npm run typecheck` (`astro check`) · `npm run build` (runs the type check first)

Vitest uses Astro's Vite config via `getViteConfig` in `vitest.config.ts`.
