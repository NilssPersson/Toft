// Review tools, not tests: `npm run screenshot` and `npm run e2e:perf` run e2e/tools/*.tool.ts with the same test
// build, server and browsers as the e2e tests. `npm run e2e` and CI never run them.
import { defineConfig } from '@playwright/test';
import e2eConfig from './playwright.config.ts';

export default defineConfig({ ...e2eConfig, testMatch: '**/*.tool.ts', retries: 0, reporter: [['list']] });
