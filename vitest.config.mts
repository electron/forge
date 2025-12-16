/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: ['**/.links/**', '**/node_modules/**'],
    fileParallelism: false,
    projects: [
      {
        extends: './vitest.config.mts',
        test: {
          include: ['**/spec/**/*.spec.ts'],
          exclude: ['**/spec/**/*.slow.spec.ts'],
          name: 'fast',
        },
      },
      {
        extends: './vitest.config.mts',
        test: {
          include: ['**/spec/**/*.slow.spec.ts'],
          name: 'slow',
          hookTimeout: 240000,
          testTimeout: 240000,
        },
      },
      {
        extends: './vitest.config.mts',
        test: {
          include: ['**/spec/**/*.slow.verdaccio.spec.ts'],
          name: 'slow-verdaccio',
          hookTimeout: 240000,
          testTimeout: 240000,
        },
      },
    ],
  },
});
