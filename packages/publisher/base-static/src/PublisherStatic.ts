import path from 'node:path';

import { PublisherBase, PublisherOptions } from '@electron-forge/publisher-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

interface StaticArtifact {
  path: string;
  platform: ForgePlatform;
  arch: ForgeArch;
  keyPrefix: string;
}

interface StaticPublisherConfig {
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
}

export default abstract class PublisherStatic<C extends StaticPublisherConfig> extends PublisherBase<C> {
  protected keyForArtifact(artifact: StaticArtifact): string {
    if (this.config.keyResolver) {
      return this.config.keyResolver(path.basename(artifact.path), artifact.platform, artifact.arch);
    }

    return `${artifact.keyPrefix}/${artifact.platform}/${artifact.arch}/${path.basename(artifact.path)}`;
  }
}

export { PublisherStatic, StaticPublisherConfig, PublisherOptions };
