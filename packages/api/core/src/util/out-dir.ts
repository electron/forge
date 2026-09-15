import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';

const BASE_OUT_DIR = 'out';

export default (baseDir: string, forgeConfig: ResolvedForgeConfig): string => {
  const baseOutDir = forgeConfig.outDir || BASE_OUT_DIR;

  if (forgeConfig.buildIdentifier) {
    let identifier = forgeConfig.buildIdentifier;
    if (typeof identifier === 'function') {
      identifier = identifier();
    }
    if (identifier) return path.resolve(baseDir, baseOutDir, identifier);
  }

  return path.resolve(baseDir, baseOutDir);
};
