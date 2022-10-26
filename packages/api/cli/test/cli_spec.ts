import path from 'path';

import { spawn } from '@malept/cross-spawn-promise';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

function tsNodePath() {
  const tsNode = path.resolve(__dirname, '../../../../node_modules/.bin/ts-node');
  return process.platform === 'win32' ? `${tsNode}.cmd` : tsNode;
}

function runForgeCLI(...extraArgs: string[]): Promise<string> {
  const args = [path.resolve(__dirname, '../src/electron-forge.ts'), ...extraArgs];
  return spawn(tsNodePath(), args);
}

describe('cli', () => {
  it('should not fail on known subcommands', async () => {
    const stdout = await expect(runForgeCLI('help')).to.eventually.be.fulfilled;
    expect(stdout.toString()).to.match(/Usage:/);
  });

  it('should fail on unknown subcommands', async () => {
    const error = await expect(runForgeCLI('nonexistent')).to.eventually.be.rejected;
    expect(error.code).to.equal(1);
    expect(error.stderr).to.match(/Unknown command "nonexistent"/);
  });
});
