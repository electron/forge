import fs from 'node:fs';
import path from 'node:path';

import { spawn } from '@malept/cross-spawn-promise';
import { afterAll, describe, expect, it } from 'vitest';

import packageAPI from '../../../api/core/src/api/package';
import { getElectronExecutablePath } from '../src/util/getElectronExecutablePath';

describe('FusesPlugin', () => {
  const appPath = path.join(import.meta.dirname, 'fixture');

  const packageJSON = JSON.parse(
    fs.readFileSync(path.join(appPath, 'package.json'), {
      encoding: 'utf-8',
    }),
  );

  const { name: appName } = packageJSON;

  const outDir = path.join(appPath, 'out');

  afterAll(async () => {
    await fs.promises.rm(outDir, {
      recursive: true,
      force: true,
    });
  });

  it('should flip Fuses', async () => {
    await packageAPI({
      dir: appPath,
      interactive: false,
    });

    const electronExecutablePath = getElectronExecutablePath({
      appName,
      basePath: path.join(
        outDir,
        'fuses-test-app',
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
