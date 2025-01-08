import { describe, expect, it } from 'vitest';

import { PublisherStatic, StaticPublisherConfig } from '../src/PublisherStatic';

class PublisherImpl extends PublisherStatic<StaticPublisherConfig> {
  defaultPlatforms = [];

  name = 'test';

  public exposedKeyForArtifact = this.keyForArtifact;
}

describe('PublisherStatic', () => {
  describe('keyForArtifact', () => {
    it('should by default concat prefix, platform, arch and filename', () => {
      const publisher = new PublisherImpl({});
      expect(
        publisher.exposedKeyForArtifact({
          platform: 'plat',
          arch: 'arch',
          keyPrefix: 'stuff',
          path: __filename,
        })
      ).toEqual('stuff/plat/arch/StaticPublisher.spec.ts');
    });

    it('should call the provided method', () => {
      const publisher = new PublisherImpl({
        keyResolver: () => 'lololol',
      });
      expect(
        publisher.exposedKeyForArtifact({
          platform: 'plat',
          arch: 'arch',
          keyPrefix: 'stuff',
          path: __filename,
        })
      ).toEqual('lololol');
    });
  });
});
