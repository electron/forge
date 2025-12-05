import path from 'node:path';

import {
  PublisherBase,
  PublisherOptions,
} from '@electron-forge/publisher-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

interface StaticArtifact {
  path: string;
  platform: ForgePlatform;
  arch: ForgeArch;
  keyPrefix: string;
  version: string;
}

interface StaticPublisherConfig {
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (opts: {
    fileName: string;
    platform: string;
    arch: string;
    version: string;
  }) => string;
}

export default abstract class PublisherStatic<
  C extends StaticPublisherConfig,
> extends PublisherBase<C> {
  protected keyForArtifact(artifact: StaticArtifact): string {
    if (this.config.keyResolver) {
      return this.config.keyResolver({
        fileName: path.basename(artifact.path),
        platform: artifact.platform,
        arch: artifact.arch,
        version: artifact.version,
      });
    }

    return `${artifact.keyPrefix}/${artifact.platform}/${artifact.arch}/${path.basename(
      artifact.path,
    )}`;
  }
}

export { PublisherStatic, StaticPublisherConfig, PublisherOptions };
