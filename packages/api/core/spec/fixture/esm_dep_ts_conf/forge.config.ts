// The TypeScript config loader must load ESM-only dependencies (here one
// with top-level await) through Node's native ESM loader.
import type { ForgeConfig } from '@electron-forge/shared-types';

// @ts-expect-error the fixture package ships no type definitions
import { answer } from 'esm-tla-dep';

const config: ForgeConfig & { answer: number } = {
  buildIdentifier: 'esm-tla-dep',
  answer,
};

export default config;
