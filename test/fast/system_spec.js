import { expect } from 'chai';

import checkSystem, { isNightlyYarnVersion } from '../../src/util/check-system';
import { fakeOra } from '../../src/util/ora';

describe('check-system', () => {
  it('should succeed on valid agents', async () => {
    expect(await checkSystem(fakeOra())).to.be.equal(true);
  });

  describe('isNightlyYarnVersion', () => {
    it('should not match release versions', () => {
      expect(isNightlyYarnVersion('0.10.0')).to.be.equal(false);
    });

    it('should not match rc/beta/alpha versions', () => {
      expect(isNightlyYarnVersion('0.10.0-beta.1')).to.be.equal(false);
    });

    it('should match nightly versions', () => {
      expect(isNightlyYarnVersion('0.23.0-20170311.0515')).to.be.equal(true);
    });
  });
});
