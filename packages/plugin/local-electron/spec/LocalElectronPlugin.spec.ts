import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { LocalElectronPlugin } from '../src/LocalElectronPlugin';

describe('LocalElectronPlugin', () => {
  describe('start logic', () => {
    const fakeForgeConfig = {} as ResolvedForgeConfig;

    beforeAll(() => {
      delete process.env.ELECTRON_OVERRIDE_DIST_PATH;
    });

    afterEach(() => {
      delete process.env.ELECTRON_OVERRIDE_DIST_PATH;
    });

    it('should set ELECTRON_OVERRIDE_DIST_PATH when enabled', async () => {
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).toEqual(undefined);
      const p = new LocalElectronPlugin({ electronPath: 'test/foo' });
      await p.getHooks().preStart?.(fakeForgeConfig);
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).toEqual('test/foo');
    });

    it('should not set ELECTRON_OVERRIDE_DIST_PATH when disabled', async () => {
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).toEqual(undefined);
      const p = new LocalElectronPlugin({
        enabled: false,
        electronPath: 'test/foo',
      });
      await p.getHooks().preStart?.(fakeForgeConfig);
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).toEqual(undefined);
    });

    it("should throw an error if platforms don't match", async () => {
      const p = new LocalElectronPlugin({
        electronPath: 'test/bar',
        electronPlatform: 'wut',
      });
      await expect(p.getHooks().preStart?.(fakeForgeConfig)).rejects.toThrow(
        `Can not use local Electron version, required platform "${process.platform}" but local platform is "wut"`,
      );
    });
  });

  describe('hooks', () => {
    let p: LocalElectronPlugin;

    beforeEach(() => {
      p = new LocalElectronPlugin({ electronPath: 'test/foo' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p.init('', {} as any);
    });

    describe('with afterExtract hook', () => {
      let tmpDir: string;

      beforeEach(async () => {
        const tmp = os.tmpdir();
        const tmpdir = path.join(tmp, 'electron-forge-test-');
        tmpDir = await fs.promises.mkdtemp(tmpdir);
        await fs.promises.writeFile(path.resolve(tmpDir, 'touch'), 'hey');
      });

      afterEach(async () => await fs.promises.rm(tmpDir, { recursive: true }));

      it('should return a function for packageAfterExtract', () => {
        expect(p.getHooks().packageAfterExtract).toBeTypeOf('function');
      });

      it('should do nothing when disabled', async () => {
        p.config.enabled = false;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHooks().packageAfterExtract!;

        await fn(
          {} as ResolvedForgeConfig,
          tmpDir,
          'null',
          process.platform,
          process.arch,
        );

        expect(fs.existsSync(tmpDir)).toEqual(true);
        expect(fs.existsSync(path.resolve(tmpDir, 'touch'))).toEqual(true);
      });

      it("should throw an error if the platform doesn't match", async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHooks().packageAfterExtract!;

        await expect(
          fn({} as ResolvedForgeConfig, tmpDir, 'null', 'bad', process.arch),
        ).rejects.toThrow(
          `Can not use local Electron version, required platform "bad" but local platform is "${process.platform}"`,
        );
      });

      it("should throw an error if the arch doesn't match", async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHooks().packageAfterExtract!;

        await expect(
          fn(
            {} as ResolvedForgeConfig,
            tmpDir,
            'null',
            process.platform,
            'bad',
          ),
        ).rejects.toThrow(
          `Can not use local Electron version, required arch "bad" but local arch is "${process.arch}"`,
        );
      });

      it('should copy the electron dir to the build dir if everything is ok and enabled', async () => {
        const electronDir = await fs.promises.mkdtemp(
          path.resolve(os.tmpdir(), 'electron-tmp-'),
        );
        await fs.promises.writeFile(
          path.resolve(electronDir, 'electron'),
          'hi i am electron I swear',
        );
        p.config.electronPath = electronDir;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHooks().packageAfterExtract!;

        await fn(
          {} as ResolvedForgeConfig,
          tmpDir,
          'null',
          process.platform,
          process.arch,
        );

        expect(fs.existsSync(path.resolve(tmpDir, 'touch'))).toEqual(false);
        expect(fs.existsSync(path.resolve(tmpDir, 'electron'))).toEqual(true);
        expect(
          await fs.promises.readFile(path.resolve(tmpDir, 'electron'), 'utf8'),
        ).toEqual('hi i am electron I swear');
      });
    });
  });
});
