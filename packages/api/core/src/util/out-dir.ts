import path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';

const BASE_OUT_DIR = 'out';

export default (baseDir: string, forgeConfig: ResolvedForgeConfig): string => {
  if (forgeConfig.buildIdentifier) {
    let identifier = forgeConfig.buildIdentifier;
    if (typeof identifier === 'function') {
      identifier = identifier();
    }
    if (identifier) return path.resolve(baseDir, BASE_OUT_DIR, identifier);
  }
  return path.resolve(baseDir, BASE_OUT_DIR);
};
