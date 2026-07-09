import path from 'node:path';

import { move } from '@electron-forge/core-utils/fs';
import { ForgeArch } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';
import { describe, expect, it, vi } from 'vitest';

import { MakerMSIX } from '../src/MakerMSIX';

vi.mock(import('electron-windows-msix'), () => {
  return {
    packageMSIX: vi.fn().mockResolvedValue({
      msixPackage: '/tmp/mock-output.msix',
    }),
  };
});

vi.mock(import('node:fs/promises'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      mkdtemp: vi.fn().mockResolvedValue('/tmp/msix-maker-mock'),
      mkdir: vi.fn(),
      rm: vi.fn(),
    },
  };
});

vi.mock(import('@electron-forge/core-utils/fs'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    move: vi.fn(),
  };
});

describe('MakerMSIX', () => {
  const appName = 'My Test App';
  const targetPlatform = 'win32';
  const targetArch = 'x64' as ForgeArch;
  const dir = `/my/test/dir/${appName}-${targetPlatform}-${targetArch}`;
  const makeDir = '/my/test/dir/make';
  const packageJSON = { version: '1.2.3' };

  it('should generate an MSIX with version and arch in the filename', async () => {
    const maker = new MakerMSIX({}, []);
    await maker.prepareConfig(targetArch);
    const output = await maker.make({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      targetPlatform,
      forgeConfig: null as any,
    });

    expect(output).toHaveLength(1);
    expect(output[0]).toBe(
      path.resolve(
        makeDir,
        'msix',
        targetArch,
        `${path.basename(dir)}-${packageJSON.version}.msix`,
      ),
    );
    expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
    expect(vi.mocked(move)).toHaveBeenCalledWith(
      '/tmp/mock-output.msix',
      path.resolve(
        makeDir,
        'msix',
        targetArch,
        `${path.basename(dir)}-${packageJSON.version}.msix`,
      ),
    );
  });

  it('should use the configured outputFileName when set', async () => {
    const outputFileName = 'custom-package-name';
    const maker = new MakerMSIX({ outputFileName }, []);
    await maker.prepareConfig(targetArch);
    const output = await maker.make({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      targetPlatform,
      forgeConfig: null as any,
    });

    const expectedPath = path.resolve(
      makeDir,
      'msix',
      targetArch,
      `${outputFileName}.msix`,
    );

    expect(output).toHaveLength(1);
    expect(output[0]).toBe(expectedPath);
    expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
    expect(vi.mocked(move)).toHaveBeenCalledWith(
      '/tmp/mock-output.msix',
      expectedPath,
    );
  });

  it.each([
    { kind: 'sync', outputFileName: () => 'computed-package-name' },
    { kind: 'async', outputFileName: async () => 'computed-package-name' },
  ])(
    'should resolve outputFileName when it is a $kind function',
    async ({ outputFileName }) => {
      const maker = new MakerMSIX({ outputFileName }, []);
      await maker.prepareConfig(targetArch);
      const output = await maker.make({
        dir,
        makeDir,
        appName,
        targetArch,
        packageJSON,
        targetPlatform,
        forgeConfig: null as any,
      });

      const expectedPath = path.resolve(
        makeDir,
        'msix',
        targetArch,
        'computed-package-name.msix',
      );

      expect(output).toHaveLength(1);
      expect(output[0]).toBe(expectedPath);
      expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
      expect(vi.mocked(move)).toHaveBeenCalledWith(
        '/tmp/mock-output.msix',
        expectedPath,
      );
    },
  );
});
