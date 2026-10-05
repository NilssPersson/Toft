// Runs before every component test (*.test.tsx, jsdom).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/** jsdom has no matchMedia. Every query is false: no reduced motion, not an installed app. */
function stubMatchMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
}

window.matchMedia = stubMatchMedia;

// Testing Library waits on a setTimeout(0) after each event and only advances it under Jest's fake timers,
// so with vi.useFakeTimers() it would hang. Pointing its `jest` check at Vitest makes the two work together.
Object.assign(globalThis, { jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) } });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
