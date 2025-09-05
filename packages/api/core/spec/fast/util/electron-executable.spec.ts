import path from 'node:path';

import { describe, expect, it } from 'vitest';

import locateElectronExecutable from '../../../src/util/electron-executable';

const fixtureDir = path.resolve(
  __dirname,
  '..',
  '..',
  'fixture',
  'electron-executable',
);

describe('locateElectronExecutable', () => {
  it('returns the correct path to electron', async () => {
    const appFixture = path.join(fixtureDir, 'electron_app');
    const packageJSON = {
      devDependencies: { electron: '^100.0.0' },
    };

    await expect(
      locateElectronExecutable(appFixture, packageJSON),
    ).resolves.toEqual('execPath');
  });
});
