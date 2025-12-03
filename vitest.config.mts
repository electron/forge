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
          hookTimeout: 160000,
          testTimeout: 160000,
        },
      },
    ],
  },
});
