import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    // `.claude` can hold git worktrees of this repo, whose specs would
    // otherwise be collected as duplicates of the real ones.
    exclude: ['**/.claude/**', '**/.links/**', '**/node_modules/**'],
    fileParallelism: false,
    projects: [
      {
        extends: './vitest.config.mts',
        test: {
          include: ['**/spec/**/*.spec.ts'],
          exclude: [
            '**/spec/**/*.slow.spec.ts',
            '**/spec/**/*.slow.verdaccio.spec.ts',
          ],
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
