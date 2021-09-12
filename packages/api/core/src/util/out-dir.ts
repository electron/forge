import { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path';

const BASE_OUT_DIR = 'out';

export default (baseDir: string, forgeConfig: ForgeConfig): string => {
  if (forgeConfig.buildIdentifier) {
    let identifier = forgeConfig.buildIdentifier;
    if (typeof identifier === 'function') {
      identifier = identifier();
    }
    if (identifier) return path.resolve(baseDir, BASE_OUT_DIR, identifier);
  }
  return path.resolve(baseDir, BASE_OUT_DIR);
};
