# Toft

A cosy 3D farming game. Grow crops on your own island, harvest them to fill the wheel, and spin your way up the levels.

The site is built with **Astro** (static output). The game itself is **React Three Fiber** (Three.js), **TypeScript** and **zustand**, mounted on `/play`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:4321
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Game-rule tests (Vitest) |
| `npm run typecheck` | Type check (`astro check`, covers `.astro`, `.ts` and `.tsx`) |
| `npm run build` | Type check, then static build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Pages

| Route | Source | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Landing page with a Play button |
| `/play` | `src/pages/play.astro` | The game, mounted with `client:only="react"` |
| `/blog` | `src/pages/blog/` | Posts are Markdown files in `src/content/blog/` |
| `/contact` | `src/pages/contact.astro` | |
| 404 | `src/pages/404.astro` | Served by Cloudflare for unknown paths |

Marketing pages ship no JavaScript. Only `/play` loads React, three.js and the store. A sitemap is generated at `/sitemap-index.xml`.

To write a blog post, add `src/content/blog/<slug>.md` with `title`, `description` and `pubDate` in the frontmatter.

## Deploying

Deploys to Cloudflare Workers (static assets) via Workers Builds, configured in `wrangler.jsonc`. Unknown paths get `dist/404.html` with a 404 status.
Every push to `main` builds and goes live; other branches get preview URLs.

Dashboard settings (Workers & Pages → toft → Settings → Builds):

- Build command: `npm test && npm run build`
- Deploy command: `npx wrangler deploy`

The Worker must be named `toft` to match `wrangler.jsonc`. Astro needs Node 22.12 or newer; `.node-version` pins Node 22 for Workers Builds and CI.

Set the real public URL in `src/site/config.ts` (`url`). It is used for canonical links, Open Graph tags and the sitemap.

## How to play (current prototype)

1. Pick a crop in the bottom bar and click the island to plant it.
2. Blue marker = needs water: click it. The crop grows.
3. Yellow marker = ready: click to harvest. The crop stays, and its wheel slot fills.
4. Spin the wheel. A filled slot is a win, an empty slot or Reset loses this level's progress, and the multiplier pays out only when all six slots are filled.

Progress is saved in the browser automatically.

## Project layout

```
src/
  pages/    Astro routes: /, /play, /blog, /contact, 404.
  layouts/  Base.astro (SEO/Open Graph head), Page.astro (site header/footer).
  content/  Blog posts (Markdown). Schema in src/content.config.ts.
  site/     Site constants (name, URL, contact) and marketing-page CSS.
  Game.tsx  Game entry point, mounted by /play. App.tsx is the game root.
  game/     Pure game rules: types, config/tuning, grid, wheel, rules + tests.
            No React, no Three.js, no clock or randomness.
  state/    zustand store: the only bridge between rules and app (dispatch(action)).
  scene/    3D world (R3F): island, crop plots, camera, lights.
  ui/       HTML overlay: level bar, wheel, crop palette.
  styles.css  Game styles, loaded only by /play.
public/     Static files copied as-is (favicon).
```

See [DESIGN.md](DESIGN.md) for the game design and open questions, and [CLAUDE.md](CLAUDE.md) for architecture rules.
