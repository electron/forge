import { expect } from 'chai';

import getSafeDirName from '../../src/util/safe-dir-name';

describe('getSafeDirName', () => {
  it('returns a safe dir name', () => {
    const appName = 'My Co/ol App';
    const dirName = getSafeDirName(appName);

    expect(dirName).to.equal('My-Co-ol-App');
  });
});
