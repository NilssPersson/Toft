// End-to-end tests: a test build (window.__toft enabled, built to dist-e2e/) served by astro preview.
// Playwright starts and stops the server itself; never start one by hand. See "Testing" in CLAUDE.md.
import { existsSync } from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

const PORT = 4329;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = process.env.CI !== undefined;

/** Software WebGL, so the three.js canvas renders in headless Chromium without a GPU. */
const SOFTWARE_WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/** Where Claude cloud sessions have Chromium preinstalled, often a different version than Playwright pins. */
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';

/**
 * The browser to launch: PW_CHROMIUM_PATH if set, else the preinstalled Chromium when the pinned one is missing
 * (as in Claude cloud sessions). Undefined means the browser Playwright installed, as in CI.
 */
function chromiumPath(): string | undefined {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  if (existsSync(chromium.executablePath())) return undefined;
  return existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;
}

const executablePath = chromiumPath();

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: SOFTWARE_WEBGL_ARGS, executablePath },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone-landscape', use: { ...devices['iPhone 14 landscape'], browserName: 'chromium' } },
  ],
  // preview:test passes --ignore-lock: without it, Astro moves the preview server to the background when it
  // detects an AI agent, and Playwright loses the process it is meant to wait on and shut down.
  webServer: {
    command: `npm run build:test && npm run preview:test -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
