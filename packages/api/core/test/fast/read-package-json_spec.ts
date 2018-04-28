import path from 'path';
import { expect } from 'chai';

import readPackageJSON from '../../src/util/read-package-json';

describe('read-package-json', () => {
  it('should find a package.json file from the given directory', async () => {
    expect(await readPackageJSON(path.resolve(__dirname, '../..'))).to.deep.equal(require('../../package.json'));
  });
});
