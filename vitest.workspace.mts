import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
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
      hookTimeout: 120000,
      testTimeout: 120000,
    },
  },
]);
