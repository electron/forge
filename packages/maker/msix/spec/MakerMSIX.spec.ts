import path from 'node:path';

import { move } from '@electron-forge/core-utils';
import { ForgeArch } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
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
  const packageJSON = {
    name: 'my-test-app',
    version: '1.2.3',
    description: 'A test app',
    author: 'Test Author <test@example.com>',
  };
  const mockTmpDir = '/tmp/msix-maker-mock';

  describe('isSupportedOnCurrentPlatform', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform',
    )!;

    afterEach(() => {
      Object.defineProperty(process, 'platform', originalPlatform);
    });

    it.each([
      { platform: 'win32', supported: true },
      { platform: 'linux', supported: false },
      { platform: 'darwin', supported: false },
    ])('should return $supported on $platform', ({ platform, supported }) => {
      Object.defineProperty(process, 'platform', {
        ...originalPlatform,
        value: platform,
      });
      const maker = new MakerMSIX({});
      expect(maker.isSupportedOnCurrentPlatform()).toBe(supported);
    });

    it('should only make for win32 by default', () => {
      const maker = new MakerMSIX({});
      expect(maker.platforms).toEqual(['win32']);
    });
  });

  it('should pass through correct defaults derived from package.json', async () => {
    const maker = new MakerMSIX({}, []);
    await maker.prepareConfig(targetArch);
    await maker.make({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      targetPlatform,
      forgeConfig: null as any,
    });

    expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
    expect(vi.mocked(packageMSIX)).toHaveBeenCalledWith({
      appDir: dir,
      outputDir: mockTmpDir,
      manifestVariables: {
        packageDescription: 'A test app',
        appExecutable: 'My Test App.exe',
        packageVersion: '1.2.3',
        publisher: 'Test Author',
        packageIdentity: appName,
        targetArch: 'x64',
      },
    });
  });

  it('should convert the target arch to its MSIX name', async () => {
    const maker = new MakerMSIX({}, []);
    await maker.prepareConfig('ia32');
    await maker.make({
      dir,
      makeDir,
      appName,
      targetArch: 'ia32',
      packageJSON,
      targetPlatform,
      forgeConfig: null as any,
    });

    expect(vi.mocked(packageMSIX)).toHaveBeenCalledWith(
      expect.objectContaining({
        manifestVariables: expect.objectContaining({ targetArch: 'x86' }),
      }),
    );
  });

  it('should have config cascade correctly', async () => {
    const windowsKitPath = 'C:\\Program Files (x86)\\Windows Kits\\10';
    const maker = new MakerMSIX(
      {
        manifestVariables: {
          publisher: 'CN=Custom Publisher',
          packageVersion: '4.3.2.1',
          packageDisplayName: 'Custom Display Name',
        },
        windowsKitPath,
        createPri: false,
        outputFileName: 'custom-package-name',
      },
      [],
    );
    await maker.prepareConfig(targetArch);
    await maker.make({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      targetPlatform,
      forgeConfig: null as any,
    });

    expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
    expect(vi.mocked(packageMSIX)).toHaveBeenCalledWith(
      expect.objectContaining({
        appDir: dir,
        outputDir: mockTmpDir,
        windowsKitPath,
        createPri: false,
        manifestVariables: {
          packageDescription: 'A test app',
          appExecutable: 'My Test App.exe',
          packageVersion: '4.3.2.1',
          publisher: 'CN=Custom Publisher',
          packageIdentity: appName,
          targetArch: 'x64',
          packageDisplayName: 'Custom Display Name',
        },
      }),
    );
    // Forge-only options must not leak through to electron-windows-msix
    expect(vi.mocked(packageMSIX).mock.calls[0][0]).not.toHaveProperty(
      'outputFileName',
    );
  });

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
