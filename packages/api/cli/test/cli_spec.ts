import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import spawnPromise from 'cross-spawn-promise';

chai.use(chaiAsPromised);

function tsNodePath() {
  const tsNode = path.resolve(__dirname, '../../../../node_modules/.bin/ts-node');
  return process.platform === 'win32' ? `${tsNode}.cmd` : tsNode;
}

describe('cli', () => {
  it('should fail on unknown subcommands', async () => {
    const error = await expect(spawnPromise(tsNodePath(), [path.resolve(__dirname, '../src/electron-forge.ts'), 'nonexistent'])).to.eventually.be.rejected;
    expect(error.exitStatus).to.equal(1);
    expect(error.stderr.toString()).to.match(/Unknown command "nonexistent"/);
  });
});
