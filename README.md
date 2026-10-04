# Toft

A cosy 3D farming game. Grow crops on your own island, harvest them to fill the wheel, and spin your way up the levels.

Built with **React Three Fiber** (Three.js), **TypeScript**, **zustand** and **Vite**.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Game-rule tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build to `dist/` |

## Deploying

Deploys to Cloudflare Workers (static assets) via Workers Builds, configured in `wrangler.jsonc`.
Every push to `main` builds and goes live; other branches get preview URLs.

Dashboard settings (Workers & Pages → toft → Settings → Builds):

- Build command: `npm test && npm run build`
- Deploy command: `npx wrangler deploy`

The Worker must be named `toft` to match `wrangler.jsonc`.

## How to play (current prototype)

1. Pick a crop in the bottom bar and click the island to plant it.
2. Blue marker = needs water: click it. The crop grows.
3. Yellow marker = ready: click to harvest. The crop stays, and its wheel slot fills.
4. Spin the wheel. A filled slot is a win, an empty slot or Reset loses this level's progress, and the multiplier pays out only when all six slots are filled.

Progress is saved in the browser automatically.

## Project layout

```
src/
  game/     Pure game rules: types, config/tuning, grid, wheel, rules + tests.
            No React, no Three.js, no clock or randomness.
  state/    zustand store: the only bridge between rules and app (dispatch(action)).
  scene/    3D world (R3F): island, crop plots, camera, lights.
  ui/       HTML overlay: level bar, wheel, crop palette.
```

See [DESIGN.md](DESIGN.md) for the game design and open questions, and [CLAUDE.md](CLAUDE.md) for architecture rules.
