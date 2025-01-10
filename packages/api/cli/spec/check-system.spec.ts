import { describe, expect, it } from 'vitest';

import { checkValidPackageManagerVersion } from '../src/util/check-system';

describe('check-system', () => {
  describe('validPackageManagerVersion', () => {
    it('should consider whitelisted versions to be valid', () => {
      expect(() => checkValidPackageManagerVersion('NPM', '3.10.1', '^3.0.0')).not.toThrow();
    });

    it('should consider Yarn nightly versions to be invalid', () => {
      expect(() => checkValidPackageManagerVersion('Yarn', '0.23.0-20170311.0515', '0.23.0')).toThrow();
    });

    it('should consider invalid semver versions to be invalid', () => {
      expect(() => checkValidPackageManagerVersion('Yarn', '0.22', '0.22.0')).toThrow();
    });
  });
});
