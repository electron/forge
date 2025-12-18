import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
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
      hookTimeout: 160000,
      testTimeout: 160000,
    },
  },
  {
    extends: './vitest.config.mts',
    test: {
      include: ['**/spec/**/*.slow.verdaccio.spec.ts'],
      name: 'verdaccio',
      hookTimeout: 160000,
      testTimeout: 160000,
    },
  },
]);
