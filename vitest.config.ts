/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    projects: [
      // Game rules: pure functions, no DOM.
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'], environment: 'node' } },
      // HUD behaviour: React components in jsdom, driven through Testing Library.
      {
        extends: true,
        test: {
          name: 'components',
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['src/testing/setupComponentTests.ts'],
        },
      },
    ],
  },
});
