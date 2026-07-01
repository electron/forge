// Top-level await plus an extensionless relative TypeScript import, in a
// project without "type": "module" — the template-shaped config that the
// TypeScript config loader must keep supporting (see #3872 / #3676).
import type { ForgeConfig } from '@electron-forge/shared-types';

import { getBuildIdentifier } from './src/identifier';

const buildIdentifier = await getBuildIdentifier();

const config: ForgeConfig = {
  buildIdentifier,
};

export default config;
