import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import { IgnoreFunction } from '@electron/packager';
import { setAppRestartHandler } from '@electron-forge/core-utils/restart';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { VitePluginConfig } from '../src/Config';
import { VitePlugin } from '../src/VitePlugin';

vi.mock(import('node:child_process'), async (importOriginal) => ({
  ...(await importOriginal()),
  spawn: vi.fn(),
}));

describe('VitePlugin', async () => {
  const baseConfig: VitePluginConfig = {
    build: [],
    renderer: [],
  };

  const tmp = os.tmpdir();
  const tmpdir = path.join(tmp, 'electron-forge-test-');
  const viteTestDir = await fs.promises.mkdtemp(tmpdir);

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(viteTestDir, 'package.json');
    const packagedPath = path.join(viteTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: VitePlugin;

    beforeAll(async () => {
      await fs.promises.mkdir(packagedPath);
      plugin = new VitePlugin(baseConfig);
      plugin.setDirectories(viteTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = {
        main: './.vite/build/main.cjs',
        config: { forge: 'config.js' },
      };
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify(packageJSON),
        'utf-8',
      );
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(fs.existsSync(packagedPackageJSONPath)).toEqual(true);
      expect(
        JSON.parse(await fs.promises.readFile(packagedPackageJSONPath, 'utf-8'))
          .config,
      ).not.toHaveProperty('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { main: '.vite/build/main.cjs' };
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify(packageJSON),
        'utf-8',
      );
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(fs.existsSync(packagedPackageJSONPath)).toEqual(true);
      expect(
        JSON.parse(
          await fs.promises.readFile(packagedPackageJSONPath, 'utf-8'),
        ),
      ).not.toHaveProperty('config');
    });

    it('should fail if there is no main key in package.json', async () => {
      const packageJSON = {};
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify(packageJSON),
        'utf-8',
      );
      await expect(
        plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath),
      ).rejects.toThrow(/entry point/);
    });

    it('should fail if main in package.json does not starts with .vite/', async () => {
      const packageJSON = { main: 'src/main.js' };
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify(packageJSON),
        'utf-8',
      );
      await expect(
        plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath),
      ).rejects.toThrow(/entry point/);
    });

    it('should fail with an upgrade hint if main points at the old .js bundle', async () => {
      const buildDir = path.join(packagedPath, '.vite', 'build');
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.writeFile(path.join(buildDir, 'main.cjs'), '');
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify({ main: '.vite/build/main.js' }),
        'utf-8',
      );
      await expect(
        plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath),
      ).rejects.toThrow(/"\.vite\/build\/main\.cjs"/);
    });

    it('should succeed if main points at a .js bundle that exists', async () => {
      const buildDir = path.join(packagedPath, '.vite', 'build');
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.writeFile(path.join(buildDir, 'custom.js'), '');
      await fs.promises.writeFile(
        packageJSONPath,
        JSON.stringify({ main: '.vite/build/custom.js' }),
        'utf-8',
      );
      await expect(
        plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath),
      ).resolves.toBeUndefined();
    });

    afterAll(async () => {
      await fs.promises.rm(viteTestDir, { recursive: true });
    });
  });

  describe('resolveForgeConfig', () => {
    let plugin: VitePlugin;

    beforeAll(() => {
      plugin = new VitePlugin(baseConfig);
    });

    it('sets packagerConfig and packagerConfig.ignore if it does not exist', async () => {
      const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
      expect(config.packagerConfig).not.toEqual(undefined);
      expect(config.packagerConfig.ignore).toBeTypeOf('function');
    });

    describe('packagerConfig.ignore', () => {
      it('does not overwrite an existing ignore value', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ResolvedForgeConfig);

        expect(config.packagerConfig.ignore).toEqual(/test/);
      });

      it('ignores everything but files in .vite', async () => {
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('')).toEqual(false);
        expect(ignore('/abc')).toEqual(true);
        expect(ignore('/.vite')).toEqual(false);
        expect(ignore('/.vite/foo')).toEqual(false);
      });

      it('ignores source map files by default', async () => {
        const viteConfig = { ...baseConfig };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).toEqual(
          false,
        );
        expect(
          ignore(path.posix.join('/.vite', 'build', 'main.js.map')),
        ).toEqual(false);
        expect(
          ignore(
            path.posix.join(
              '/.vite',
              'renderer',
              'main_window',
              'assets',
              'index.js',
            ),
          ),
        ).toEqual(false);
        expect(
          ignore(
            path.posix.join(
              '/.vite',
              'renderer',
              'main_window',
              'assets',
              'index.js.map',
            ),
          ),
        ).toEqual(false);
      });

      it('includes source map files when specified by config', async () => {
        const viteConfig = { ...baseConfig, packageSourceMaps: true };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).toEqual(
          false,
        );
        expect(
          ignore(path.posix.join('/.vite', 'build', 'main.js.map')),
        ).toEqual(false);
        expect(
          ignore(
            path.posix.join(
              '/.vite',
              'renderer',
              'main_window',
              'assets',
              'index.js',
            ),
          ),
        ).toEqual(false);
        expect(
          ignore(
            path.posix.join(
              '/.vite',
              'renderer',
              'main_window',
              'assets',
              'index.js.map',
            ),
          ),
        ).toEqual(false);
      });
    });
  });

  describe('build watch subprocess', () => {
    class FakeChild extends EventEmitter {
      stdout = new PassThrough();
      stderr = new PassThrough();
      kill = vi.fn();
    }

    let child: FakeChild;
    let disposeRestartHandler: (() => void) | undefined;

    afterEach(() => {
      disposeRestartHandler?.();
      disposeRestartHandler = undefined;
    });

    // Runs the dev-mode `build` task for a single main target against a fake
    // watch subprocess, up to the end of its first build.
    const startWatchBuild = async (config: Partial<VitePluginConfig> = {}) => {
      child = new FakeChild();
      vi.mocked(spawn).mockReturnValue(
        child as unknown as ReturnType<typeof spawn>,
      );

      const plugin = new VitePlugin({
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
        ],
        renderer: [],
        ...config,
      });
      plugin.setDirectories(viteTestDir);

      type Task = { task: () => Promise<void> };
      const [buildTask] = (await plugin.build({
        newListr: (tasks: Task[]) => tasks,
      } as never)) as unknown as Task[];
      const firstBuild = buildTask.task();
      child.emit('message', { type: 'first-build-done' });
      await firstBuild;
    };

    it('passes hotRestart to the watch subprocess', async () => {
      await startWatchBuild({ hotRestart: true });

      const env = vi.mocked(spawn).mock.calls[0][2]?.env;
      expect(env?.FORGE_VITE_WATCH).toEqual('1');
      expect(JSON.parse(env!.FORGE_VITE_CONFIG!)).toMatchObject({
        hotRestart: true,
      });
    });

    it('restarts the app when the subprocess asks for it', async () => {
      const handler = vi.fn(() => true);
      disposeRestartHandler = setAppRestartHandler(handler);
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      await startWatchBuild({ hotRestart: true });

      child.emit('message', { type: 'restart' });

      expect(handler).toHaveBeenCalledOnce();
      expect(consoleWarn).not.toHaveBeenCalled();
    });

    it('warns when a restart asked for by the subprocess is not honored', async () => {
      disposeRestartHandler = setAppRestartHandler(() => false);
      const consoleWarn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      await startWatchBuild({ hotRestart: true });

      child.emit('message', { type: 'restart' });

      expect(consoleWarn).toHaveBeenCalledOnce();
      expect(consoleWarn.mock.calls[0][0]).toContain(
        'the running app was not restarted',
      );
    });
  });
});
