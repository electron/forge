import fs from 'node:fs';
import path from 'node:path';

import { ensureTestDirIsNonexistent } from '@electron-forge/test-utils';
import { spawn } from '@malept/cross-spawn-promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../../api/core/dist/api';
import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const fixtureDir = path.join(__dirname, 'fixture', 'app');
  let appPath: string;
  let appName: string;

  beforeAll(async () => {
    delete process.env.TS_NODE_PROJECT;
    appPath = await ensureTestDirIsNonexistent();

    // Initialize a new Forge project (base template includes plugin-fuses)
    await api.init({
      dir: appPath,
      interactive: false,
    });

    // Read the app name from the generated package.json
    const packageJSON = JSON.parse(
      await fs.promises.readFile(path.join(appPath, 'package.json'), 'utf-8'),
    );
    appName = packageJSON.name;

    // Replace the main entry file with our test fixture
    const fixtureMainJs = await fs.promises.readFile(
      path.join(fixtureDir, 'src', 'main.js'),
      'utf-8',
    );
    await fs.promises.writeFile(
      path.join(appPath, 'src', 'index.js'),
      fixtureMainJs,
    );
  });

  afterAll(async () => {
    await fs.promises.rm(appPath, { recursive: true, force: true });
  });

  it('should flip Fuses', async () => {
    await api.package({
      dir: appPath,
      interactive: false,
    });

    const outDir = path.join(
      appPath,
      'out',
      `${appName}-${process.platform}-${process.arch}`,
    );
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
