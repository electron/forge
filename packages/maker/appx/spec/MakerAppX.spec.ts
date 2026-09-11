import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import windowsStore from 'electron-windows-store';
import { makeCert } from 'electron-windows-store/lib/sign.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createDefaultCertificate,
  MakerAppX,
  MakerAppXConfig,
} from '../src/MakerAppX';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock('electron-windows-store', () => {
  return {
    default: vi.fn().mockResolvedValue(undefined),
  };
});

// Only wrap `makeCert` so that the real `isValidPublisherName` still runs and
// the Windows-only `createDefaultCertificate` test below keeps exercising the
// real Windows SDK tooling. The unit tests for `make()` swap in a resolved
// value per-test and reset it afterwards.
vi.mock('electron-windows-store/lib/sign.js', async (importOriginal) => {
  const mod =
    await importOriginal<typeof import('electron-windows-store/lib/sign.js')>();
  return {
    ...mod,
    makeCert: vi.fn(mod.makeCert),
  };
});

describe.runIf(process.platform === 'win32')('MakerAppX', function () {
  describe('createDefaultCertificate', () => {
    let tmpDir: string;

    beforeAll(async () => {
      const tmp = os.tmpdir();
      const tmpdir = path.join(tmp, 'electron-forge-test-');
      tmpDir = await fs.mkdtemp(tmpdir);
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true });
    });

    it('should create a .pfx file', async () => {
      await fs.copyFile(
        path.join(
          import.meta.dirname,
          '../../../api/core/spec/fixture',
          'bogus-private-key.pvk',
        ),
        path.join(tmpDir, 'dummy.pvk'),
      );
      const outputCertPath = await createDefaultCertificate('CN=Test', {
        certFilePath: tmpDir,
        certFileName: 'dummy',
        install: false,
      });

      const fileContents = await fs.readFile(outputCertPath);
      expect(fileContents).toBeInstanceOf(Buffer);
      expect(fileContents.length).toBeGreaterThan(0);
    });
  });
});

describe('MakerAppX', () => {
  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/my/test/dir/make');
  const appName = 'My Test App';
  const targetArch: ForgeArch = 'x64';
  const outPath = path.resolve(makeDir, 'appx', targetArch);
  // `make()` falls back to locating makeappx.exe in the Windows SDK when this
  // is not configured, which is not available on non-Windows CI runners.
  const windowsKit = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64';
  const mockCertPath = '/my/test/dir/make/appx/x64/default.pfx';
  const packageJSON = {
    name: 'my-test-app',
    version: '1.2.3',
    description: 'A test app',
    author: 'Test Author <test@example.com>',
  };

  const expectedDefaults = {
    publisher: 'CN=Test Author',
    flatten: false,
    deploy: false,
    packageVersion: '1.2.3.0',
    packageName: 'mytestapp',
    packageDisplayName: appName,
    packageDescription: 'A test app',
    packageExecutable: 'app\\My Test App.exe',
    windowsKit,
    devCert: mockCertPath,
    inputDirectory: dir,
    outputDirectory: outPath,
  };

  async function runMake(
    config: MakerAppXConfig,
    overrides: Partial<MakerOptions> = {},
  ) {
    const maker = new MakerAppX(config, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);
    const output = await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      ...overrides,
    });
    return { maker, output };
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
      vi.mocked(makeCert).mockResolvedValue(mockCertPath);
    });

    afterEach(() => {
      vi.mocked(makeCert).mockReset();
    });

    it('should pass through correct defaults derived from package.json', async () => {
      const { maker, output } = await runMake({ windowsKit });

      expect(maker.ensureDirectory).toHaveBeenCalledWith(outPath);
      expect(vi.mocked(windowsStore)).toHaveBeenCalledOnce();
      expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(expectedDefaults);
      expect(output).toEqual([path.resolve(outPath, 'mytestapp.appx')]);
    });

    it('should fall back to the app name when package.json has no description', async () => {
      await runMake(
        { windowsKit },
        { packageJSON: { ...packageJSON, description: undefined } },
      );

      expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
        expect.objectContaining({ packageDescription: appName }),
      );
    });

    it('should have config cascade correctly', async () => {
      const finalSay = vi.fn().mockResolvedValue(undefined);
      const config: MakerAppXConfig = {
        windowsKit: 'D:\\Custom\\Kits',
        publisher: 'CN=Custom Publisher, O=Custom Org',
        flatten: true,
        deploy: true,
        packageVersion: '4.3.2.1',
        packageName: 'custompackage',
        packageDisplayName: 'Custom Display Name',
        packageDescription: 'Custom description',
        packageExecutable: 'app\\custom.exe',
        devCert: 'C:\\certs\\custom.pfx',
        certPass: 'hunter2',
        assets: 'C:\\my\\assets',
        makeappxParams: ['/verbose'],
        signtoolParams: ['/debug'],
        makePri: true,
        finalSay,
      };

      const { output } = await runMake(config);

      expect(vi.mocked(windowsStore)).toHaveBeenCalledOnce();
      expect(vi.mocked(windowsStore)).toHaveBeenCalledWith({
        ...config,
        inputDirectory: dir,
        outputDirectory: outPath,
      });
      expect(output).toEqual([path.resolve(outPath, 'custompackage.appx')]);
    });

    it('should forward finalSay when provided', async () => {
      const finalSay = vi.fn().mockResolvedValue(undefined);
      await runMake({ windowsKit, finalSay });

      expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
        expect.objectContaining({ finalSay }),
      );
    });

    describe('publisher', () => {
      it('should derive the publisher from package.json author when not configured', async () => {
        await runMake(
          { windowsKit },
          {
            packageJSON: {
              ...packageJSON,
              author: { name: 'Object Author', email: 'author@example.com' },
            },
          },
        );

        expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
          expect.objectContaining({ publisher: 'CN=Object Author' }),
        );
      });

      it('should throw when the configured publisher is empty', async () => {
        await expect(runMake({ windowsKit, publisher: '' })).rejects.toThrow(
          'Please set config.forge.windowsStoreConfig.publisher or author.name in package.json for the appx target',
        );
        expect(vi.mocked(windowsStore)).not.toHaveBeenCalled();
      });

      it('should throw when the publisher is not an X.500 distinguished name', async () => {
        await expect(
          runMake({ windowsKit, publisher: 'Not A Distinguished Name' }),
        ).rejects.toThrow(
          "Received invalid publisher name: 'Not A Distinguished Name' did not conform to X.500 distinguished name syntax for MakeCert.",
        );
        expect(vi.mocked(makeCert)).not.toHaveBeenCalled();
        expect(vi.mocked(windowsStore)).not.toHaveBeenCalled();
      });
    });

    describe('devCert', () => {
      it('should create a default certificate next to the output when devCert is not configured', async () => {
        await runMake({ windowsKit });

        expect(vi.mocked(makeCert)).toHaveBeenCalledOnce();
        expect(vi.mocked(makeCert)).toHaveBeenCalledWith(
          expect.objectContaining({
            publisherName: 'CN=Test Author',
            certFilePath: outPath,
            certFileName: 'default',
            install: false,
          }),
        );
        expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
          expect.objectContaining({ devCert: mockCertPath }),
        );
      });

      it('should forward the configured devCert without creating a certificate', async () => {
        const devCert = 'C:\\certs\\my-cert.pfx';
        await runMake({ windowsKit, devCert });

        expect(vi.mocked(makeCert)).not.toHaveBeenCalled();
        expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
          expect.objectContaining({ devCert }),
        );
      });
    });

    describe('packageVersion', () => {
      it.each([
        { kind: 'prerelease', version: '1.0.0-beta.1' },
        { kind: 'build metadata', version: '1.0.0+20130313144700' },
      ])(
        'should throw for a $kind version when makeVersionWinStoreCompatible is not set',
        async ({ version }) => {
          await expect(
            runMake(
              { windowsKit },
              { packageJSON: { ...packageJSON, version } },
            ),
          ).rejects.toThrow(
            "Windows Store version numbers don't support semver beta tags. To " +
              'automatically fix this, set makeVersionWinStoreCompatible to true or ' +
              'explicitly set packageVersion to a version of the format X.Y.Z.A',
          );
          expect(vi.mocked(windowsStore)).not.toHaveBeenCalled();
        },
      );

      it('should throw for a prerelease version when makeVersionWinStoreCompatible is false', async () => {
        await expect(
          runMake(
            { windowsKit, makeVersionWinStoreCompatible: false },
            { packageJSON: { ...packageJSON, version: '1.0.0-beta.1' } },
          ),
        ).rejects.toThrow(
          "Windows Store version numbers don't support semver beta tags.",
        );
        expect(vi.mocked(windowsStore)).not.toHaveBeenCalled();
      });

      it.each([
        { version: '1.0.0-beta.1', expected: '1.0.0.0' },
        { version: '1.0.0-alpha+001', expected: '1.0.0.0' },
        { version: '2.0.0', expected: '2.0.0.0' },
      ])(
        'should normalize $version to $expected when makeVersionWinStoreCompatible is true',
        async ({ version, expected }) => {
          await runMake(
            { windowsKit, makeVersionWinStoreCompatible: true },
            { packageJSON: { ...packageJSON, version } },
          );

          expect(vi.mocked(windowsStore)).toHaveBeenCalledWith(
            expect.objectContaining({ packageVersion: expected }),
          );
        },
      );

      it('should not forward makeVersionWinStoreCompatible to electron-windows-store', async () => {
        await runMake({ windowsKit, makeVersionWinStoreCompatible: true });

        expect(vi.mocked(windowsStore)).toHaveBeenCalledOnce();
        expect(vi.mocked(windowsStore).mock.calls[0][0]).not.toHaveProperty(
          'makeVersionWinStoreCompatible',
        );
      });
    });
  });
});
