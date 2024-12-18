import * as path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import make from '../../src/api/make';

// eslint-disable-next-line node/no-unsupported-features/es-syntax
vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getElectronVersion: vi.fn().mockResolvedValue('1.0.0'),
  };
});

describe('make', () => {
  const fixtureDir = path.resolve(__dirname, '../../test/fixture');

  it.todo('should call "package"');

  it('works with @scoped package names', async () => {
    const result = await make({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-scoped-name'),
      platform: 'linux',
      skipPackage: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].artifacts).toEqual([expect.stringContaining('@scope-package-linux-x64-1.0.0.zip')]);
  });

  it('can override targets', async () => {
    const results = await make({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-custom-maker-config'),
      overrideTargets: ['../custom-maker'],
      platform: 'linux',
      skipPackage: true,
    });

    expect(results[0].artifacts).toEqual(['from config']);
  });

  it('throws an error if the name is not a string', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'maker-name-wrong-type'),
        platform: 'linux',
        skipPackage: true,
      })
    ).rejects.toThrowError(/^The following maker config has a maker name that is not a string:/);
  });

  it('throws an error if the name is missing', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'maker-sans-name'),
        platform: 'linux',
        skipPackage: true,
      })
    ).rejects.toThrowError(/^The following maker config is missing a maker name:/);
  });

  it('can skip makers via config', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'app-with-maker-disable'),
        platform: 'linux',
        skipPackage: true,
      })
    ).rejects.toThrowError(/Could not find any make targets configured for the "linux" platform./);
  });

  it('throws if maker cannot be resolved', async () => {
    const opts = {
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-custom-maker-config'),
      platform: 'linux',
      skipPackage: true,
    };

    await expect(make(opts)).rejects.toThrowError("Could not find module with name '@electron-forge/non-existent-forge-maker'");
  });
});
