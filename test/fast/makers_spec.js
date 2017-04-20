import { expect } from 'chai';

describe('makers', () => {
  describe('supportsPlatform', () => {
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
        const { supportsPlatform } = require(`../../src/makers/${maker}`);
        expect(supportsPlatform).to.equal(expected[maker].includes(process.platform));
      });
    });
  });
});
