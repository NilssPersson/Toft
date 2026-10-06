// `npm run e2e:perf`: prints the average and p95 frame time of /play on desktop and phone-landscape.
// Under software WebGL the numbers are only useful compared with main on the same machine, never as absolutes.
import { expect, test } from '@playwright/test';
import { gotoGame, measureFrameTimes } from '../game.ts';

/** The first frames compile shaders and would skew the numbers. */
const WARM_UP_FRAMES = 5;
/** Few frames: each takes 100–300 ms locally and about 1 s in CI. */
const MEASURED_FRAMES = 20;
const P95 = 0.95;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? Number.NaN;
}

test('frame time on /play', async ({ page }, testInfo) => {
  await gotoGame(page);
  await measureFrameTimes(page, WARM_UP_FRAMES);
  const frames = await measureFrameTimes(page, MEASURED_FRAMES);

  expect(frames).toHaveLength(MEASURED_FRAMES);

  const summary = `avg ${average(frames).toFixed(0)} ms, p95 ${percentile(frames, P95).toFixed(0)} ms`;
  testInfo.annotations.push({ type: 'frame time', description: summary });
  console.log(`[${testInfo.project.name}] ${summary}`);
});
