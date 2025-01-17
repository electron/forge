/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: ['**/.links/**', '**/node_modules/**'],
    fileParallelism: false,
  },
});
