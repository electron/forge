import { expect } from 'chai';

describe('makers', () => {
  describe('supportedPlatforms', () => {
    const expected = {
      'darwin/dmg': ['darwin'],
      'generic/zip': ['darwin', 'linux', 'win32'],
      'linux/deb': ['darwin', 'linux'],
      'linux/flatpak': ['darwin', 'linux'],
      'linux/rpm': ['darwin', 'linux'],
      'win32/appx': ['win32'],
      'win32/squirrel': ['darwin', 'linux', 'win32'],
    };

    Object.keys(expected).forEach((maker) => {
      it(`for ${maker} should be correct`, () => {
        const supportedPlatforms = require(`../../src/makers/${maker}`).supportedPlatforms;
        expect(supportedPlatforms.sort()).to.deep.equal(expected[maker].sort());
      });
    });
  });
});
