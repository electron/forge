import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.mts',
    test: {
      include: ['**/spec/**/*.spec.ts'],
      exclude: ['**/spec/**/*.slow.spec.ts'],
      name: 'fast',
      maxConcurrency: 1,
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  },
  {
    extends: './vitest.config.mts',
    test: {
      include: ['**/spec/**/*.slow.spec.ts'],
      name: 'slow',
      hookTimeout: 60000,
      testTimeout: 120000,
      maxConcurrency: 1,
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  },
]);
