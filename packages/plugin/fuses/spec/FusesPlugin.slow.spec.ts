import fs from 'node:fs';
import path from 'node:path';

import { PACKAGE_MANAGERS, spawnPackageManager } from '@electron-forge/core-utils';
import { CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { initLink } from '../../../api/core/src/api/init-scripts/init-link';
import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const appPath = path.join(__dirname, 'fixture', 'app');

  const spawnOptions: CrossSpawnOptions = {
    cwd: appPath,
    shell: true,
  };

  const packageJSON = JSON.parse(
    fs.readFileSync(path.join(appPath, 'package.json.tmpl'), {
      encoding: 'utf-8',
    })
  );

  const { name: appName } = packageJSON;

  const outDir = path.join(appPath, 'out', 'fuses-test-app');

  beforeAll(async () => {
    await spawnPackageManager(PACKAGE_MANAGERS['yarn'], ['run', 'link:prepare']);
    delete process.env.TS_NODE_PROJECT;
    await fs.promises.copyFile(path.join(appPath, 'package.json.tmpl'), path.join(appPath, 'package.json'));
    await spawn('yarn', ['install'], spawnOptions);

    // Installing deps removes symlinks that were added at the start of this
    // spec via `api.init`. So we should re-link local forge dependencies
    // again.
    process.env.LINK_FORGE_DEPENDENCIES_ON_INIT = '1';
    await initLink(PACKAGE_MANAGERS['yarn'], appPath);
    delete process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
  });

  afterAll(async () => {
    await fs.promises.rm(path.resolve(outDir, '../'), { recursive: true, force: true });
  });

  it('should flip Fuses', async () => {
    await spawn('yarn', ['package'], spawnOptions);

    const electronExecutablePath = getElectronExecutablePath({
      appName,
      basePath: path.join(outDir, ...(process.platform === 'darwin' ? [`${appName}.app`, 'Contents'] : [])),
      platform: process.platform,
    });

    const args: string[] = process.platform === 'linux' ? ['-v', '--no-sandbox'] : ['-v'];

    /**
     * If the `RunAsNode` fuse had not been flipped,
     * this would return the Node.js version (e.g. `v14.16.0`)
     * instead of the `console.log` from `main.js`.
     */
    const output = (
      await spawn(electronExecutablePath, args, {
        env: {
          ELECTRON_RUN_AS_NODE: '1',
        },
      })
    ).trim();

    expect(output).toEqual('The Fuses plugin is working');
  });
});
