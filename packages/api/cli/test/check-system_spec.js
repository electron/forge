import { fakeOra } from '@electron-forge/async-ora';
import { expect } from 'chai';

import checkSystem, { validPackageManagerVersion } from '../src/util/check-system';

describe('check-system', () => {
  it('should succeed on valid agents', async () => {
    expect(await checkSystem(fakeOra())).to.be.equal(true);
  });

  describe('validPackageManagerVersion', () => {
    it('should consider whitelisted versions to be valid', () => {
      expect(validPackageManagerVersion('NPM', '3.10.1', '^3.0.0', fakeOra())).to.be.equal(true);
    });

    it('should consider Yarn nightly versions to be invalid', () => {
      expect(validPackageManagerVersion('Yarn', '0.23.0-20170311.0515', '0.23.0', fakeOra())).to.be.equal(false);
    });

    it('should consider invalid semver versions to be invalid', () => {
      expect(validPackageManagerVersion('Yarn', '0.22', '0.22.0', fakeOra())).to.be.equal(false);
    });
  });
});
