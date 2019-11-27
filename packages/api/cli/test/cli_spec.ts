import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import spawnPromise from 'cross-spawn-promise';

chai.use(chaiAsPromised);

describe('cli', () => {
  it('should fail on unknown subcommands', async () => {
    const error = await expect(spawnPromise(path.resolve(__dirname, '../../../../node_modules/.bin/ts-node'), [path.resolve(__dirname, '../src/electron-forge.ts'), 'nonexistent'])).to.eventually.be.rejected;
    expect(error.exitStatus).to.equal(1);
    expect(error.stderr.toString()).to.match(/Unknown command "nonexistent"/);
  });
});
