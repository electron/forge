import fs, { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { move } from '@electron-forge/core-utils';
import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MakerAppX, MakerAppXConfig } from '../src/MakerAppX';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock(import('electron-windows-msix'), () => {
  return {
    packageMSIX: vi.fn().mockResolvedValue({
      msixPackage: '/tmp/appx-maker-mock/mytestapp.msix',
    }),
  };
});

vi.mock(import('node:fs/promises'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      mkdtemp: vi.fn().mockResolvedValue('/tmp/appx-maker-mock'),
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

describe('MakerAppX', () => {
  const mockTmpDir = '/tmp/appx-maker-mock';
  const mockMsixPath = `${mockTmpDir}/mytestapp.msix`;
  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/my/test/dir/make');
  const appName = 'My Test App';
  const targetArch: ForgeArch = 'x64';
  const outPath = path.resolve(makeDir, 'appx', targetArch);
  const packageJSON = {
    name: 'my-test-app',
    version: '1.2.3',
    description: 'A test app',
    author: 'Test Author <test@example.com>',
  };

  const expectedDefaults = {
    appDir: dir,
    outputDir: mockTmpDir,
    packageName: 'mytestapp.msix',
    createPri: false,
    manifestVariables: {
      packageIdentity: 'mytestapp',
      publisher: 'CN=Test Author',
      packageVersion: '1.2.3.0',
      packageDisplayName: appName,
      packageDescription: 'A test app',
      appExecutable: 'My Test App.exe',
      targetArch: 'x64',
    },
  };

  let maker: MakerAppX;

  async function runMake(
    config: MakerAppXConfig,
    overrides: Partial<MakerOptions> = {},
  ) {
    maker = new MakerAppX(config, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(overrides.targetArch ?? targetArch);
    return (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      ...overrides,
    });
  }

  function packagingOptions() {
    return vi.mocked(packageMSIX).mock.calls[0][0];
  }

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
      const maker = new MakerAppX({}, []);
      expect(maker.isSupportedOnCurrentPlatform()).toBe(supported);
    });

    it('should only make for win32 by default', () => {
      const maker = new MakerAppX({});
      expect(maker.platforms).toEqual(['win32']);
    });
  });

  describe('make', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should pass through correct defaults derived from package.json', async () => {
      const output = await runMake({});

      expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
      expect(vi.mocked(packageMSIX)).toHaveBeenCalledWith(expectedDefaults);
      expect(packagingOptions().windowsSignOptions).toBeUndefined();
      expect(output).toEqual([path.resolve(outPath, 'mytestapp.msix')]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should move the generated .msix into make/appx/<arch>', async () => {
      const output = await runMake({});

      expect(vi.mocked(move)).toHaveBeenCalledWith(mockMsixPath, output[0]);
      expect(output).toEqual([path.resolve(outPath, 'mytestapp.msix')]);
    });

    it('should clear the arch output directory before moving the .msix', async () => {
      await runMake({});

      expect(maker.ensureDirectory).toHaveBeenCalledOnce();
      expect(maker.ensureDirectory).toHaveBeenCalledWith(outPath);
      expect(
        vi.mocked(maker.ensureDirectory).mock.invocationCallOrder[0],
      ).toBeLessThan(vi.mocked(move).mock.invocationCallOrder[0]);
    });

    it('should still return the .msix when the temporary folder cannot be removed', async () => {
      vi.mocked(fs.rm).mockRejectedValueOnce(new Error('EBUSY: resource busy'));

      const output = await runMake({});

      expect(output).toEqual([path.resolve(outPath, 'mytestapp.msix')]);
      expect(console.warn).toHaveBeenCalledOnce();
      expect(vi.mocked(console.warn).mock.calls[0].join(' ')).toContain(
        `Could not remove the temporary folder "${mockTmpDir}": EBUSY: resource busy`,
      );
    });

    it('should fall back to the app name when package.json has no description', async () => {
      await runMake(
        {},
        { packageJSON: { ...packageJSON, description: undefined } },
      );

      expect(packagingOptions().manifestVariables).toMatchObject({
        packageDescription: appName,
      });
    });

    it('should map every supported option onto electron-windows-msix', async () => {
      const config: MakerAppXConfig = {
        windowsKit: 'D:\\Custom\\Kits',
        publisher: 'CN=Custom Publisher, O=Custom Org',
        packageVersion: '4.3.2.1',
        packageName: 'custompackage',
        packageDisplayName: 'Custom Display Name',
        packageDescription: 'Custom description',
        packageBackgroundColor: '#464646',
        packageExecutable: 'custom.exe',
        devCert: 'C:\\certs\\custom.pfx',
        certPass: 'hunter2',
        assets: 'C:\\my\\assets',
        manifest: 'C:\\my\\AppxManifest.xml',
        signtoolParams: ['/debug'],
        makePri: true,
      };

      const output = await runMake(config);

      expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
      expect(vi.mocked(packageMSIX)).toHaveBeenCalledWith({
        appDir: dir,
        outputDir: mockTmpDir,
        packageName: 'custompackage.msix',
        appManifest: 'C:\\my\\AppxManifest.xml',
        packageAssets: 'C:\\my\\assets',
        windowsKitPath: 'D:\\Custom\\Kits',
        createPri: true,
        windowsSignOptions: {
          certificateFile: 'C:\\certs\\custom.pfx',
          certificatePassword: 'hunter2',
          signWithParams: ['/debug'],
        },
        manifestVariables: {
          packageIdentity: 'custompackage',
          publisher: 'CN=Custom Publisher, O=Custom Org',
          packageVersion: '4.3.2.1',
          packageDisplayName: 'Custom Display Name',
          packageDescription: 'Custom description',
          packageBackgroundColor: '#464646',
          appExecutable: 'custom.exe',
          targetArch: 'x64',
        },
      });
      expect(output).toEqual([path.resolve(outPath, 'custompackage.msix')]);
    });

    it('should not forward Forge-only options to electron-windows-msix', async () => {
      await runMake({
        makeVersionWinStoreCompatible: true,
        makePri: true,
        devCert: 'C:\\certs\\custom.pfx',
      });

      const options = packagingOptions();
      for (const key of [
        'makeVersionWinStoreCompatible',
        'makePri',
        'devCert',
        'certPass',
        'signtoolParams',
      ]) {
        expect(options).not.toHaveProperty(key);
      }
    });

    it.each([
      { arch: 'x64', expected: 'x64' },
      { arch: 'arm64', expected: 'arm64' },
      { arch: 'ia32', expected: 'x86' },
    ] as const)(
      'should convert $arch to the MSIX arch $expected',
      async ({ arch, expected }) => {
        const output = await runMake({}, { targetArch: arch });

        expect(packagingOptions().manifestVariables).toMatchObject({
          targetArch: expected,
        });
        expect(output).toEqual([
          path.resolve(makeDir, 'appx', arch, 'mytestapp.msix'),
        ]);
      },
    );

    describe('packageExecutable', () => {
      it.each([
        { configured: 'app\\custom.exe', expected: 'custom.exe' },
        { configured: 'app/custom.exe', expected: 'custom.exe' },
        { configured: 'App\\MyApp.exe', expected: 'MyApp.exe' },
        { configured: 'APP/MyApp.exe', expected: 'MyApp.exe' },
        { configured: 'custom.exe', expected: 'custom.exe' },
        { configured: 'bin\\custom.exe', expected: 'bin\\custom.exe' },
      ])(
        'should map $configured to appExecutable $expected',
        async ({ configured, expected }) => {
          await runMake({ packageExecutable: configured });

          expect(packagingOptions().manifestVariables).toMatchObject({
            appExecutable: expected,
          });
        },
      );
    });

    describe('publisher', () => {
      it('should derive the publisher from package.json author when not configured', async () => {
        await runMake(
          {},
          {
            packageJSON: {
              ...packageJSON,
              author: { name: 'Object Author', email: 'author@example.com' },
            },
          },
        );

        expect(packagingOptions().manifestVariables).toMatchObject({
          publisher: 'CN=Object Author',
        });
      });

      it('should throw when neither publisher nor package.json author is set', async () => {
        await expect(
          runMake({}, { packageJSON: { ...packageJSON, author: undefined } }),
        ).rejects.toThrow(
          'Please set the "publisher" option in the maker config or "author.name" in package.json for the appx target',
        );
        expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
      });

      it('should throw when the configured publisher is empty', async () => {
        await expect(runMake({ publisher: '' })).rejects.toThrow(
          'Please set the "publisher" option in the maker config or "author.name" in package.json for the appx target',
        );
        expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
      });

      it('should throw when the publisher is not an X.500 distinguished name and no devCert is set', async () => {
        await expect(
          runMake({ publisher: 'Not A Distinguished Name' }),
        ).rejects.toThrow(
          "Received invalid publisher name: 'Not A Distinguished Name' did not conform to X.500 distinguished name syntax.",
        );
        expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
      });

      it.each([
        'CN=Test Author',
        'CN="Quoted, Inc.", O=Org',
        'CN=Foo; OU=Bar',
        'OID.1.2.840.113549.1.9.1=test@example.com',
        'cn=lowercase,',
      ])(
        'should accept the well-formed distinguished name %s',
        async (publisher) => {
          await runMake({ publisher });

          expect(packagingOptions().manifestVariables).toMatchObject({
            publisher,
          });
        },
      );

      it('should forward an unusual publisher unchanged when devCert is set', async () => {
        const publisher = 'Not A Distinguished Name';
        await runMake({ publisher, devCert: 'C:\\certs\\custom.pfx' });

        expect(packagingOptions().manifestVariables).toMatchObject({
          publisher,
        });
      });

      it.each([
        {
          shape: 'unterminated quoted value',
          publisher: 'CN="' + 'a'.repeat(50_000),
        },
        {
          shape: 'repeated ;KEY= separators',
          publisher: 'C=' + ';C='.repeat(50_000) + '"',
        },
        {
          shape: 'whitespace around separators',
          publisher: 'C=' + ' , C='.repeat(50_000) + '"',
        },
      ])(
        'should reject an $shape without catastrophic backtracking',
        async ({ publisher }) => {
          const start = performance.now();

          await expect(runMake({ publisher })).rejects.toThrow(
            'did not conform to X.500 distinguished name syntax.',
          );

          expect(performance.now() - start).toBeLessThan(1000);
          expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
        },
      );
    });

    describe('signing', () => {
      it('should leave signing to electron-windows-msix when devCert is not configured', async () => {
        await runMake({ certPass: 'ignored', signtoolParams: ['/debug'] });

        expect(packagingOptions().windowsSignOptions).toBeUndefined();
      });

      it.each([
        { option: 'certPass', value: 'hunter2' },
        { option: 'signtoolParams', value: ['/debug'] },
      ] satisfies { option: keyof MakerAppXConfig; value: unknown }[])(
        'should warn that $option is ignored when devCert is not configured',
        async ({ option, value }) => {
          await runMake({ [option]: value });

          expect(console.warn).toHaveBeenCalledOnce();
          expect(vi.mocked(console.warn).mock.calls[0].join(' ')).toContain(
            `The "${option}" option is ignored by @electron-forge/maker-appx because "devCert" is not set.`,
          );
          expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
        },
      );

      it('should not warn about certPass or signtoolParams when devCert is configured', async () => {
        await runMake({
          devCert: 'C:\\certs\\my-cert.pfx',
          certPass: 'hunter2',
          signtoolParams: ['/debug'],
        });

        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should sign with the configured devCert', async () => {
        await runMake({ devCert: 'C:\\certs\\my-cert.pfx' });

        expect(packagingOptions()).toMatchObject({
          windowsSignOptions: { certificateFile: 'C:\\certs\\my-cert.pfx' },
        });
      });

      describe('generated dev certificate', () => {
        const certFiles = ['dev_cert.cer', 'dev_cert.pfx'];
        let tmpDir: string;

        beforeEach(async () => {
          tmpDir = await mkdtemp(path.join(os.tmpdir(), 'appx-maker-spec-'));
          vi.mocked(fs.mkdtemp).mockResolvedValueOnce(tmpDir);
          vi.mocked(packageMSIX).mockImplementationOnce(
            async ({ outputDir }) => {
              for (const certFile of certFiles) {
                await writeFile(path.join(outputDir, certFile), '');
              }
              return { msixPackage: path.join(outputDir, 'mytestapp.msix') };
            },
          );
        });

        afterEach(async () => {
          await rm(tmpDir, { recursive: true, force: true });
        });

        it('should keep the certificate electron-windows-msix generated next to the .msix', async () => {
          const output = await runMake({});

          expect(output).toEqual([path.resolve(outPath, 'mytestapp.msix')]);
          for (const certFile of certFiles) {
            expect(vi.mocked(move)).toHaveBeenCalledWith(
              path.resolve(tmpDir, certFile),
              path.resolve(outPath, certFile),
            );
          }
          expect(vi.mocked(move)).toHaveBeenCalledTimes(3);
        });

        it('should not move certificates when devCert is configured', async () => {
          const output = await runMake({ devCert: 'C:\\certs\\my-cert.pfx' });

          expect(vi.mocked(move)).toHaveBeenCalledOnce();
          expect(vi.mocked(move)).toHaveBeenCalledWith(
            path.join(tmpDir, 'mytestapp.msix'),
            output[0],
          );
        });
      });
    });

    describe('makePri', () => {
      it.each([
        { makePri: undefined, createPri: false },
        { makePri: false, createPri: false },
        { makePri: true, createPri: true },
      ])(
        'should map makePri $makePri to createPri $createPri',
        async ({ makePri, createPri }) => {
          await runMake({ makePri });

          expect(packagingOptions()).toMatchObject({ createPri });
        },
      );
    });

    describe('packageVersion', () => {
      it.each([
        { kind: 'prerelease', version: '1.0.0-beta.1' },
        { kind: 'build metadata', version: '1.0.0+20130313144700' },
      ])(
        'should throw for a $kind version when makeVersionWinStoreCompatible is not set',
        async ({ version }) => {
          await expect(
            runMake({}, { packageJSON: { ...packageJSON, version } }),
          ).rejects.toThrow(
            "Windows Store version numbers don't support semver beta tags. To " +
              'automatically fix this, set makeVersionWinStoreCompatible to true or ' +
              'explicitly set packageVersion to a version of the format X.Y.Z.A',
          );
          expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
        },
      );

      it('should throw for a prerelease version when makeVersionWinStoreCompatible is false', async () => {
        await expect(
          runMake(
            { makeVersionWinStoreCompatible: false },
            { packageJSON: { ...packageJSON, version: '1.0.0-beta.1' } },
          ),
        ).rejects.toThrow(
          "Windows Store version numbers don't support semver beta tags.",
        );
        expect(vi.mocked(packageMSIX)).not.toHaveBeenCalled();
      });

      it.each([
        { version: '1.0.0-beta.1', expected: '1.0.0.0' },
        { version: '1.0.0-alpha+001', expected: '1.0.0.0' },
        { version: '2.0.0', expected: '2.0.0.0' },
      ])(
        'should normalize $version to $expected when makeVersionWinStoreCompatible is true',
        async ({ version, expected }) => {
          await runMake(
            { makeVersionWinStoreCompatible: true },
            { packageJSON: { ...packageJSON, version } },
          );

          expect(packagingOptions().manifestVariables).toMatchObject({
            packageVersion: expected,
          });
        },
      );

      it('should normalize an explicitly configured prerelease packageVersion', async () => {
        await runMake({
          makeVersionWinStoreCompatible: true,
          packageVersion: '3.0.0-rc.1',
        });

        expect(packagingOptions().manifestVariables).toMatchObject({
          packageVersion: '3.0.0.0',
        });
      });
    });

    describe('unsupported options', () => {
      it.each([
        { option: 'containerVirtualization', value: true },
        { option: 'createConfigParams', value: ['/verbose'] },
        { option: 'createPriParams', value: ['/verbose'] },
        { option: 'deploy', value: false },
        { option: 'desktopConverter', value: 'C:\\DesktopAppConverter' },
        { option: 'expandedBaseImage', value: 'C:\\BaseImage' },
        { option: 'finalSay', value: async () => {} },
        { option: 'flatten', value: false },
        { option: 'makeappxParams', value: ['/verbose'] },
      ] satisfies { option: keyof MakerAppXConfig; value: unknown }[])(
        'should warn about and ignore $option',
        async ({ option, value }) => {
          await runMake({ [option]: value });

          expect(console.warn).toHaveBeenCalledOnce();
          expect(vi.mocked(console.warn).mock.calls[0].join(' ')).toContain(
            `The "${option}" option is not supported by @electron-forge/maker-appx anymore and will be ignored.`,
          );
          expect(vi.mocked(packageMSIX)).toHaveBeenCalledOnce();
          expect(packagingOptions()).not.toHaveProperty(option);
        },
      );

      it('should warn once per unsupported option', async () => {
        await runMake({ deploy: true, flatten: true, makeappxParams: [] });

        expect(console.warn).toHaveBeenCalledTimes(3);
      });
    });
  });
});
