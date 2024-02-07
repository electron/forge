// eslint-disable-next-line node/no-unpublished-import
import type { Plugin } from 'vite';

export function onBuildDone(callback: () => void) {
  return {
    name: '@electron-forge/plugin-vite:build-done',
    closeBundle() {
      callback();
    },
  } as Plugin;
}
