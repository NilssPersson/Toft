// End-to-end tests: a test build (window.__toft enabled, built to dist-e2e/) served by astro preview.
// Playwright starts and stops the server itself; never start one by hand. See "Testing" in CLAUDE.md.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = process.env.CI !== undefined;

/** Software WebGL, so the three.js canvas renders in headless Chromium without a GPU. */
const SOFTWARE_WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

/**
 * A preinstalled Chromium for when it doesn't match the pinned Playwright version (as in Claude cloud
 * sessions: PW_CHROMIUM_PATH=/opt/pw-browsers/chromium). Unset, Playwright uses the browser it installed.
 */
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // One at a time: every page renders the 3D scene in software (SwiftShader) on every frame, which takes all the
  // CPU it gets. Two workers made each test about 1.7× slower, for little gain overall, and pushed screenshot tests
  // past the 30 s timeout in CI and the crop-harvest test past its 5 s wait.
  workers: 1,
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
