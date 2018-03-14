import PublisherBase from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import fs from 'fs-extra';
import path from 'path';
import Snapcraft from 'electron-installer-snap/snapcraft';

export default class PublisherSnapcraft extends PublisherBase {
  constructor() {
    super('snapcraft');
  }

  async publish({ dir, makeResults, config }) {
    const artifacts = makeResults.reduce((flat, makeResult) => {
      flat.push(...makeResult.artifacts);
      return flat;
    }, []);

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
      await snapcraft.run(dir, 'push', config, snapArtifacts);
    });
  }
}
