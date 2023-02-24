import fs from 'fs';
import path from 'path';

import { CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import { expect } from 'chai';
import fsExtra from 'fs-extra';

import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const appPath = path.join(__dirname, 'fixture', 'app');

  const spawnOptions: CrossSpawnOptions = {
    cwd: appPath,
    shell: true,
  };

  const packageJSON = JSON.parse(
    fs.readFileSync(path.join(appPath, 'package.json'), {
      encoding: 'utf-8',
    })
  );

  const { name: appName } = packageJSON;

  // @TODO get rid of this once https://github.com/electron/forge/pull/3123 lands
  const platformArchSuffix = `${process.platform}-x64`;

  const outDir = path.join(appPath, 'out', `${appName}-${platformArchSuffix}`);

  before(async () => {
    delete process.env.TS_NODE_PROJECT;
    await spawn('yarn', ['install'], spawnOptions);
  });

  after(async () => {
    await fsExtra.remove(path.resolve(outDir, '../'));

    // @TODO this can be removed once the mock app installs a published version of @electron-forge/plugin-fuses instead of a local package
    await fsExtra.remove(path.join(__dirname, './fixture/app/node_modules'));
  });

  it('should flip Fuses', async () => {
    await spawn('yarn', ['package'], spawnOptions);

    const electronExecutablePath = getElectronExecutablePath({
      appName,
      basePath: path.join(outDir, ...(process.platform === 'darwin' ? [`${appName}.app`, 'Contents'] : [])),
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
