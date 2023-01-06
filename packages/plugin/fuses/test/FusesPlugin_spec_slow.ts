import fs from 'fs';
import path from 'path';

import { CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import { expect } from 'chai';
import fsExtra from 'fs-extra';

import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const appPath = path.join(__dirname, 'fixtures', 'app');

  const spawnOptions: CrossSpawnOptions = {
    cwd: appPath,
    shell: true,
  };

  // @TODO get rid of this once https://github.com/electron/forge/pull/3123 lands
  const platformArchSuffix = `${process.platform}-x64`;

  const outDir = path.join(appPath, 'out', `fuses-test-app-${platformArchSuffix}`);

  before(async () => {
    await spawn('yarn', ['install'], spawnOptions);
  });

  after(async () => await fsExtra.remove(outDir));

  it('should flip Fuses', async () => {
    await spawn('yarn', ['package'], spawnOptions);

    const packageJSON = JSON.parse(
      await fs.promises.readFile(path.join(appPath, 'package.json'), {
        encoding: 'utf-8',
      })
    );

    const electronExecutablePath = getElectronExecutablePath({
      appName: packageJSON.name,
      basePath: outDir,
      platform: process.platform,
    });

    /**
     * If the `RunAsNode` fuse had not been flipped,
     * this would return the Node.js version (e.g. `v14.16.0`)
     * instead of the `console.log` from `main.js`.
     */
    const output = (
      await spawn(electronExecutablePath, ['-v'], {
        env: {
          ELECTRON_RUN_AS_NODE: '1',
        },
      })
    ).trim();

    expect(output).to.equals('The Fuses plugin is working');
  });
});
