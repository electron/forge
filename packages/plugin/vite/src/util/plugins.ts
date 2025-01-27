import type { Plugin } from 'vite';

export function onBuildDone(onfulfilled: () => void, onrejected: (error: Error) => void) {
  return {
    name: '@electron-forge/plugin-vite:build-done',
    buildEnd(error) {
      error && onrejected(error);
    },
    generateBundle(options, bundle, isWrite) {
      isWrite || onfulfilled();
    },
    writeBundle() {
      onfulfilled();
    },
    renderError(error) {
      error && onrejected(error);
    },
  } as Plugin;
}
