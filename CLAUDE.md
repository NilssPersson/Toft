# Toft — notes for AI assistants

Cosy 3D farming game. Astro site (static output) with the game on `/play`: React Three Fiber + TypeScript + zustand. Design lives in `DESIGN.md`.

## Site structure

- Routes live in `src/pages/`. `/play` mounts `src/Game.tsx` with `client:only="react"`; the game never renders on the server.
- **Game code stays on `/play`.** Never import `three`, `@react-three/*`, `src/state`, `src/scene`, `src/ui`, `App.tsx` or `Game.tsx` from any other page or from the layouts. Marketing pages ship no JS; check `dist/` after building if in doubt.
- Marketing pages use `src/layouts/Page.astro`; every page's `<head>` (title, description, Open Graph) comes from `src/layouts/Base.astro`.
- Blog posts are Markdown in `src/content/blog/`, schema in `src/content.config.ts`.
- Site constants (name, public URL, contact) are in `src/site/config.ts`.

## PWA

- `public/manifest.webmanifest` and the icon/theme tags in `Base.astro` are on every page; they are tags only, no JS.
- **The service worker registers only from `/play`**, in the game bundle (`src/pwa/serviceWorker.ts`). Never add a registration script to the layouts or marketing pages; ESLint blocks importing `src/pwa` or `workbox-window` there.
- **Never force a reload during play.** No `skipWaiting`/`clientsClaim` on install and no auto-reload on update: a new version waits for the next launch or for the player to tap Restart on the update prompt.
- The service worker is generated after the build by `integrations/serviceWorker.ts` (Workbox). `/play` is precached; other pages are network-first.
- Fullscreen helpers live in `src/pwa/fullscreen.ts` and `src/ui/Fullscreen.tsx`, never in `src/game`.

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

## Testing

Three levels. Prefer the lowest one that can catch the bug.

- **Rules → unit** (`src/**/*.test.ts`, Vitest, node). Pure functions in `src/game`.
- **HUD behaviour → component** (`src/**/*.test.tsx`, Vitest, jsdom, Testing Library). Query by role and label; set state with `useStore.setState` and control `now`/`roll` with `setSources` from `src/state/clock.ts`. To control a HUD timer, use `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })` with `userEvent.setup({ advanceTimers })` (see `src/ui/Hud.test.tsx`).
- **Whole flows and layout → e2e** (`e2e/*.spec.ts`, Playwright, desktop and phone-landscape). Start every test with `await gotoGame(page)` from `e2e/game.ts`; see `e2e/README.md`.

Rules:

- Run `npm test` (unit and component) and `npm run e2e`. **Never start a server yourself for e2e**: Playwright builds the test build into `dist-e2e/`, serves it, waits for it and shuts it down. `npm run e2e:ui` is for local debugging.
- **Never sleep or use fixed timeouts.** Wait on `data-ready` / `data-state`, Playwright's web-first assertions (`await expect(locator).toHave…`) and Testing Library's `findBy*`. Lint blocks `waitForTimeout`, `networkidle`, `force` and `setTimeout` in tests.
- The app announces its state: the game root has `data-testid="game"` and `data-ready="true"` after the first frame; the wheel has `data-state="idle" | "spinning" | "result"`, each side panel (★ and shop) `data-state="open" | "closed"`, the game root `data-player-state="idle" | "walking"`, and in build mode the game root `data-build-state="off" | "valid" | "invalid"` with the ghost's cell in `data-build-cell="x,z"` (the walk is game state, so it still takes its time under reduced motion; only the bobbing stops). Anything new that animates or changes asynchronously gets a `data-state` too, and finishes at once under `prefers-reduced-motion: reduce` (e2e runs with it).
- Every interactive HUD element has an accessible name; tests use `getByRole`/`getByLabel`. `data-testid` is only for things with no role.
- **Set up state with `window.__toft`, not by playing through the canvas**, and never click canvas coordinates. The hook (`src/testing/testHook.ts`) has `getState`, `loadState`, `advanceTime`, `setNextRoll`, `now`, `isCropReady`, `dispatch`, `playerCell`, `clickCrop` (a crop click: walk next to it, then water or harvest), `startBuild` (pick a shop item) and `moveGhost` (drag the ghost to a cell). It exists only in test builds (`PUBLIC_TEST_HOOKS=true`, dynamic import); `npm run build` fails if `__toft` reaches `dist/`.
- **Control time with `advanceTime`, not `page.clock`.** `page.clock` also fakes `requestAnimationFrame`, which freezes the R3F render loop. `advanceTime` only moves the clock the store passes to the rules as `now`.
- When an e2e test fails, read the error and the trace in `test-results/` (`npx playwright show-trace <path>/trace.zip`) before changing anything. Don't add retries or longer timeouts to make it pass.
- In Claude cloud sessions, Chromium is preinstalled at `/opt/pw-browsers`; if it doesn't match the pinned Playwright version, run with `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run `playwright install` there. CI installs its own browser.

## Pull requests

- **Every agent PR includes a note** in `docs/agent-notes/` about friction in the workflow, so this file, the lint rules, scripts and skills can be improved. Name it `YYYY-MM-DD-<branch without claude/ and any random suffix>.md` and copy `_template.md`; `docs/agent-notes/README.md` has the format and what each heading means.
- Note rules: only concrete items, each with evidence (file, command, error message or rule name); "None" under an empty heading; short bullets; no advice, praise or summary of the PR; even small PRs get one.
- Order: the note is the last commit, after all checks pass, with `pr:` empty. Open the PR, with its description linking to the note. Then fill in `pr:` in a small follow-up commit.
- Never edit another PR's note. Only the separate review changes `status` (`new` → `reviewed`).
- PR descriptions follow `.github/pull_request_template.md` (Summary, How to test, Checks run, Agent notes). PRs opened through the API don't get the template automatically, so copy its headings.

## Checks

`npm run lint` · `npm run format:check` · `npm test` · `npm run typecheck` (`astro check`) · `npm run build` (runs the type check first and the `dist/` test-hook check after) · `npm run e2e`

CI's "Test and build" job runs lint, the format check, tests and the build, in that order; a separate "E2E" job runs Playwright and uploads the report and traces on failure. `npm run format` fixes formatting.

Vitest uses Astro's Vite config via `getViteConfig` in `vitest.config.ts`, with two projects: `unit` and `components`.
