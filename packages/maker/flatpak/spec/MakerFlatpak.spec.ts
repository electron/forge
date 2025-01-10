/* eslint-disable node/no-unsupported-features/es-syntax */
import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { describe, expect, it, vi } from 'vitest';

import { flatpakArch, MakerFlatpak } from '../src/MakerFlatpak';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const installer = require('@malept/electron-installer-flatpak');

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.hoisted(async () => {
  const { mockRequire } = await import('@electron-forge/test-utils');
  void mockRequire('@malept/electron-installer-flatpak', vi.fn());
});

vi.mock(import('fs-extra'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      readdir: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('MakerFlatpak', () => {
  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  it('should pass through correct defaults', async () => {
    const maker = new MakerFlatpak({}, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const expectedArch = flatpakArch(process.arch as ForgeArch);
    expect(vi.mocked(installer)).toHaveBeenCalledOnce();
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: expectedArch,
      src: dir,
      dest: path.resolve(makeDir, 'flatpak', expectedArch),
    });
  });

  it('should have config cascade correctly', async () => {
    const maker = new MakerFlatpak(
      {
        // @ts-expect-error we're passing an invalid config option in to see if it gets overridden
        arch: 'overridden',
        options: {
          productName: 'Flatpak',
          files: [],
        },
      },
      []
    );
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);

    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const expectedArch = flatpakArch(process.arch as ForgeArch);
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: expectedArch,
      options: {
        productName: 'Flatpak',
        files: [],
      },
      src: dir,
      dest: path.resolve(makeDir, 'flatpak', expectedArch),
    });
  });
});

describe.todo('flatpakArch');
