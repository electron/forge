import fs from 'fs-extra';
import path from 'path';
import Snapcraft from 'electron-installer-snap/snapcraft';

import asyncOra from '../util/ora-handler';

/**
 * `forgeConfig.snapStore`:
 * * `release`: comma-separated list of channels to release to
 */
export default async ({ dir, artifacts, forgeConfig }) => {
  const snapArtifacts = artifacts.filter(artifact => artifact.endsWith('.snap'));

  if (snapArtifacts.length === 0) {
    throw 'No snap files to upload. Please ensure that "snap" is listed in the "make_targets" in Forge config.';
  }

  const snapcraftCfgPath = path.join(dir, '.snapcraft', 'snapcraft.cfg');

  if (!await fs.pathExists(snapcraftCfgPath)) {
    throw `Snapcraft credentials not found at "${snapcraftCfgPath}". It can be generated with the command "snapcraft export-login" (snapcraft 2.37 and above).`;
  }

  await asyncOra('Pushing snap to the snap store', async () => {
    const snapcraft = new Snapcraft();
    await snapcraft.run(dir, 'push', forgeConfig.snapStore, snapArtifacts);
  });
};
