// The TypeScript config loader must respect `paths` aliases from the
// project's own tsconfig.json.
import type { ForgeConfig } from '@electron-forge/shared-types';

import { getBuildIdentifier } from '@fixture/identifier';

const config: ForgeConfig = {
  buildIdentifier: getBuildIdentifier(),
};

export default config;
