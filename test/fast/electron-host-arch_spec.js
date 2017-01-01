import { expect } from 'chai';

import electronHostArch from '../../src/util/electron-host-arch';

describe('electron-host-arch', () => {
  if (process.arch !== 'arm') {
    describe('on non-arm systems', () => {
      it('should return the current arch', () => {
        expect(electronHostArch()).to.equal(process.arch);
      });
    });
  }
});
