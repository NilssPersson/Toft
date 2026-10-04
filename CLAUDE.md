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

## Coding style

`eslint.config.js` enforces the mechanical parts; this is the intent behind them. Fix a lint error by refactoring, never by disabling the rule.

- **Small functions.** Aim for under 20 lines; 40 is the hard limit (complexity 8, nesting depth 3). A function does one thing, and its name says what. If you need a comment to explain a block, extract it into a named function instead.
- **Small components.** A component either reads state or lays out markup. Move logic into a hook (`useWheelSpin`) or a pure function (`segmentStyle`), and split markup into named pieces (`WheelFace`, `SpinButton`).
- **Few parameters.** At most 3. More than that means the arguments belong together: pass one typed object (`Placement`).
- **Names over brevity.** No one-letter names except `i`, `j` (loop indices) and `x`, `y`, `z` (coordinates); use `_` for an unused parameter. Booleans read as questions: `isReady`, `hasCrop`, `canSpin`, `needsWater`. Saved `GameState` fields keep their names (renaming one changes the save format).
- **Types are the documentation.** Exported functions and components declare their return type. No `any`, no `!`: handle `undefined` (indexing is `T | undefined` here). Use `import type` for types.
- **Every case handled.** Switches over a union (`Action['type']`, `SpotKind`) list every member with no `default`, so adding one is a type error until it's handled. `applyAction` dispatches through a handler map typed `{ [K in Action['type']]: ActionHandler<K> }`: add a new action by writing `applyX` and adding it to `HANDLERS`.
- **Lookups over branches.** Prefer a typed `Record` (`OUTCOME_TEXT`) to nested ternaries or long `if` chains.
- **Named constants.** Magic numbers and colours get a `SCREAMING_CASE` name at the top of the file; game tuning still goes in `src/game/config.ts`.
- **Formatting is Prettier's job** (120 columns, single quotes). Don't hand-format; run `npm run format`.

## Checks

`npm run lint` · `npm run format:check` · `npm test` · `npm run typecheck` (`astro check`) · `npm run build` (runs the type check first)

CI runs lint, the format check, tests and the build, in that order. `npm run format` fixes formatting.

Vitest uses Astro's Vite config via `getViteConfig` in `vitest.config.ts`.
