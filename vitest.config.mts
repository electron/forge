/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: ['**/.links/**', '**/node_modules/**'],
    // // TODO(erickzhao): the hooks from the slow tests conflict when run in parallel
    // // so we turn off parallelism for now. This makes the tests slower, so we should
    // // figure out how to re-enable this falg. 
    // fileParallelism: false,
  },
});
