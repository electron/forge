import os from 'os';
import path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';
import fs from 'fs-extra';

import { LocalElectronPlugin } from '../src/LocalElectronPlugin';

describe('LocalElectronPlugin', () => {
  describe('start logic', () => {
    before(() => {
      delete process.env.ELECTRON_OVERRIDE_DIST_PATH;
    });

    afterEach(() => {
      delete process.env.ELECTRON_OVERRIDE_DIST_PATH;
    });

    it('should set ELECTRON_OVERRIDE_DIST_PATH when enabled', async () => {
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).to.equal(undefined);
      const p = new LocalElectronPlugin({ electronPath: 'test/foo' });
      await p.startLogic();
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).to.equal('test/foo');
    });

    it('should not set ELECTRON_OVERRIDE_DIST_PATH when disabled', async () => {
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).to.equal(undefined);
      const p = new LocalElectronPlugin({ enabled: false, electronPath: 'test/foo' });
      await p.startLogic();
      expect(process.env.ELECTRON_OVERRIDE_DIST_PATH).to.equal(undefined);
    });

    it("should throw an error if platforms don't match", async () => {
      const p = new LocalElectronPlugin({ electronPath: 'test/bar', electronPlatform: 'wut' });
      await expect(p.startLogic()).to.eventually.be.rejectedWith(
        `Can not use local Electron version, required platform "${process.platform}" but local platform is "wut"`
      );
    });

    it('should always return false', async () => {
      let p = new LocalElectronPlugin({ electronPath: 'test/bar' });
      expect(await p.startLogic()).to.equal(false);

      p = new LocalElectronPlugin({ enabled: false, electronPath: 'test/bar' });
      expect(await p.startLogic()).to.equal(false);
    });
  });

  describe('hooks', () => {
    let p: LocalElectronPlugin;

    beforeEach(() => {
      p = new LocalElectronPlugin({ electronPath: 'test/foo' });
    });

    it('should return for all other hooks', () => {
      expect(p.getHook('prePackage')).to.equal(null);
      expect(p.getHook('postMake')).to.equal(null);
    });

    describe('with afterExtract hook', () => {
      let tmpDir: string;

      beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'forge-test-'));
        await fs.writeFile(path.resolve(tmpDir, 'touch'), 'hey');
      });

      afterEach(() => fs.remove(tmpDir));

      it('should return a function for packageAfterExtract', () => {
        expect(p.getHook('packageAfterExtract')).to.be.a('function');
      });

      it('should do nothing when disabled', async () => {
        p.config.enabled = false;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHook('packageAfterExtract')!;

        await fn({} as ResolvedForgeConfig, tmpDir, null, process.platform, process.arch);

        expect(await fs.pathExists(tmpDir)).to.equal(true);
        expect(await fs.pathExists(path.resolve(tmpDir, 'touch'))).to.equal(true);
      });

      it("should throw an error if the platform doesn't match", async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHook('packageAfterExtract')!;

        await expect(fn({} as ResolvedForgeConfig, tmpDir, null, 'bad', process.arch)).to.eventually.be.rejectedWith(
          `Can not use local Electron version, required platform "bad" but local platform is "${process.platform}"`
        );
      });

      it("should throw an error if the arch doesn't match", async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHook('packageAfterExtract')!;

        await expect(fn({} as ResolvedForgeConfig, tmpDir, null, process.platform, 'bad')).to.eventually.be.rejectedWith(
          `Can not use local Electron version, required arch "bad" but local arch is "${process.arch}"`
        );
      });

      it('should copy the electron dir to the build dir if everything is ok and enabled', async () => {
        const electronDir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-tmp-'));
        await fs.writeFile(path.resolve(electronDir, 'electron'), 'hi i am electron I swear');
        p.config.electronPath = electronDir;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const fn = p.getHook('packageAfterExtract')!;

        await fn({} as ResolvedForgeConfig, tmpDir, null, process.platform, process.arch);

        expect(await fs.pathExists(path.resolve(tmpDir, 'touch'))).to.equal(false);
        expect(await fs.pathExists(path.resolve(tmpDir, 'electron'))).to.equal(true);
        expect(await fs.readFile(path.resolve(tmpDir, 'electron'), 'utf8')).to.equal('hi i am electron I swear');
      });
    });
  });
});
