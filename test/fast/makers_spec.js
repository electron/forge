import { expect } from 'chai';

describe('makers', () => {
  describe('isSupportedOnCurrentPlatform', () => {
    const expected = {
      'darwin/dmg': ['darwin'],
      'generic/zip': ['darwin', 'linux', 'win32'],
      'linux/deb': ['darwin', 'linux'],
      'linux/flatpak': ['darwin', 'linux'],
      'linux/rpm': ['darwin', 'linux'],
      'win32/appx': ['win32'],
      'win32/squirrel': ['darwin', 'linux', 'win32'],
      'win32/wix': ['win32'],
    };

    Object.keys(expected).forEach(async (maker) => {
      it(`for ${maker} should be correct`, async () => {
        const { isSupportedOnCurrentPlatform } = require(`../../src/makers/${maker}`);
        await expect(isSupportedOnCurrentPlatform()).to.eventually.equal(expected[maker].includes(process.platform));
      });
    });
  });
});
