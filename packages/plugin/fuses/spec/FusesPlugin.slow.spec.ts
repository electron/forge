import fs from 'node:fs';
import path from 'node:path';

import { CrossSpawnOptions, spawn } from '@malept/cross-spawn-promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
    delete process.env.TS_NODE_PROJECT;
    await fs.promises.copyFile(path.join(appPath, 'package.json.tmpl'), path.join(appPath, 'package.json'));
    await spawn('yarn', ['install'], spawnOptions);
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
