// Build step that writes dist/sw.js with Workbox once Astro has finished the static build.
// The worker is registered only from /play (src/pwa/serviceWorker.ts); see CLAUDE.md.
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { generateSW } from 'workbox-build';
import type { GenerateSWOptions } from 'workbox-build';

const SERVICE_WORKER_FILE = 'sw.js';
const PLAY_PAGE = 'play/index.html';
const MAX_PRECACHE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_CACHED_PAGES = 50;

/** The game shell: /play and everything it loads, so it starts offline. */
const PRECACHE_PATTERNS = [PLAY_PAGE, '_astro/**/*', 'manifest.webmanifest', '*.{png,svg,ico}'];

function serviceWorkerOptions(distDir: string): GenerateSWOptions {
  return {
    globDirectory: distDir,
    globPatterns: PRECACHE_PATTERNS,
    swDest: `${distDir}/${SERVICE_WORKER_FILE}`,
    maximumFileSizeToCacheInBytes: MAX_PRECACHE_FILE_BYTES,
    inlineWorkboxRuntime: true,
    sourcemap: false,
    cleanupOutdatedCaches: true,
    // A new version waits until every tab is closed, or the player taps "Restart". Never mid-game.
    skipWaiting: false,
    clientsClaim: false,
    // /play is served from the precache, so its HTML always matches the cached JS and CSS.
    navigateFallback: PLAY_PAGE,
    navigateFallbackAllowlist: [/^\/play\/?$/],
    // Every other page is network-first, so marketing and blog content is never stale.
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: { cacheName: 'pages', expiration: { maxEntries: MAX_CACHED_PAGES } },
      },
    ],
  };
}

export function serviceWorker(): AstroIntegration {
  return {
    name: 'toft-service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const { count, size } = await generateSW(serviceWorkerOptions(fileURLToPath(dir)));
        logger.info(`${SERVICE_WORKER_FILE}: precached ${count} files (${Math.round(size / 1024)} KiB)`);
      },
    },
  };
}
