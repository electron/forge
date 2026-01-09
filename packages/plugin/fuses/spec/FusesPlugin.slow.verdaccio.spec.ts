import fs from 'node:fs';
import path from 'node:path';

import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import { ensureTestDirIsNonexistent } from '@electron-forge/test-utils';
import { CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const fixtureDir = path.join(__dirname, 'fixture', 'app');
  const forgeVersion = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '..', '..', '..', '..', 'lerna.json'),
      'utf-8',
    ),
  ).version;
  let appPath: string;

  const packageJSON = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, 'package.json.tmpl'), 'utf-8'),
  );

  const { name: appName } = packageJSON;

  beforeAll(async () => {
    delete process.env.TS_NODE_PROJECT;
    appPath = await ensureTestDirIsNonexistent();
    await fs.promises.cp(fixtureDir, appPath, { recursive: true });
    const packageJSONTemplate = await fs.promises.readFile(
      path.join(appPath, 'package.json.tmpl'),
      'utf-8',
    );
    await fs.promises.writeFile(
      path.join(appPath, 'package.json'),
      packageJSONTemplate.replace(/ELECTRON_FORGE\/VERSION/g, forgeVersion),
    );
    await fs.promises.rm(path.join(appPath, 'package.json.tmpl'));
    await spawnPackageManager(PACKAGE_MANAGERS.yarn, ['install'], {
      cwd: appPath,
    });
  });

  afterAll(async () => {
    await fs.promises.rm(appPath, { recursive: true, force: true });
  });

  it('should flip Fuses', async () => {
    const spawnOptions: CrossSpawnOptions = {
      cwd: appPath,
      shell: true,
    };
    await spawn('yarn', ['package'], spawnOptions);

    const outDir = path.join(appPath, 'out', appName);
    const electronExecutablePath = getElectronExecutablePath({
      appName,
      basePath: path.join(
        outDir,
        ...(process.platform === 'darwin'
          ? [`${appName}.app`, 'Contents']
          : []),
      ),
      platform: process.platform,
    });

    const args: string[] =
      process.platform === 'linux' ? ['-v', '--no-sandbox'] : ['-v'];

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
