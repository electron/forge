import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { IgnoreFunction } from '@electron/packager';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VitePluginConfig } from '../src/Config';
import { VitePlugin } from '../src/VitePlugin';

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
        main: './.vite/build/main.js',
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
      const packageJSON = { main: '.vite/build/main.js' };
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

    // Populate the plugin's private set of externalized modules, normally
    // filled in during the prePackage hook.
    const setExternalModules = (target: VitePlugin, modules: string[]) => {
      (target as unknown as { externalModules: Set<string> }).externalModules =
        new Set(modules);
    };

    describe('packagerConfig.ignore', () => {
      it('composes an existing RegExp ignore value with the plugin ignore', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ResolvedForgeConfig);

        // The user value is composed into a function rather than left as-is.
        expect(config.packagerConfig.ignore).toBeTypeOf('function');
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        // Plugin keep-list still survives...
        expect(ignore('/.vite/build/main.js')).toEqual(false);
        expect(ignore('/package.json')).toEqual(false);
        // ...even when the user pattern matches it.
        expect(ignore('/.vite/build/test.js')).toEqual(false);
        // Everything else is still excluded.
        expect(ignore('/test/foo.js')).toEqual(true);
        expect(ignore('/src/main.ts')).toEqual(true);
      });

      it('composes a user ignore function with the plugin allowlist', async () => {
        plugin = new VitePlugin(baseConfig);
        const userIgnore = (file: string) =>
          file.includes('secret') || file.startsWith('/node_modules');
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: userIgnore,
          },
        } as ResolvedForgeConfig);
        setExternalModules(plugin, [
          'better-sqlite3',
          '@serialport/bindings-cpp',
        ]);

        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        // The plugin's keep-list always wins, even though the user's ignore
        // excludes all of node_modules — otherwise the externalized native
        // modules would be missing from the packaged app.
        expect(ignore('/node_modules')).toEqual(false);
        expect(ignore('/node_modules/better-sqlite3')).toEqual(false);
        expect(
          ignore('/node_modules/better-sqlite3/build/Release/addon.node'),
        ).toEqual(false);
        expect(ignore('/node_modules/@serialport')).toEqual(false);
        expect(ignore('/node_modules/@serialport/bindings-cpp')).toEqual(false);
        expect(
          ignore('/node_modules/@serialport/bindings-cpp/prebuilds/x.node'),
        ).toEqual(false);
        expect(ignore('/.vite/build/secret.js')).toEqual(false);

        // Paths outside the keep-list follow user or plugin exclusions.
        expect(ignore('/node_modules/lodash')).toEqual(true);
        expect(ignore('/node_modules/@scope/other')).toEqual(true);
        expect(ignore('/secret.txt')).toEqual(true);
        expect(ignore('/src/main.ts')).toEqual(true);
      });

      it('composes an array of RegExps', async () => {
        plugin = new VitePlugin(baseConfig);
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: [/foo/, /bar/],
          },
        } as ResolvedForgeConfig);

        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('/.vite')).toEqual(false);
        expect(ignore('/foo')).toEqual(true);
        expect(ignore('/bar')).toEqual(true);
        expect(ignore('/baz')).toEqual(true);
      });

      it('keeps allowlisted native modules without a user ignore', async () => {
        plugin = new VitePlugin(baseConfig);
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        setExternalModules(plugin, ['better-sqlite3']);

        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('/node_modules/better-sqlite3')).toEqual(false);
        expect(ignore('/node_modules/better-sqlite3/lib/index.js')).toEqual(
          false,
        );
        expect(ignore('/node_modules/lodash')).toEqual(true);
      });

      it('ignores everything but .vite and package.json', async () => {
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('')).toEqual(false);
        expect(ignore('/abc')).toEqual(true);
        expect(ignore('/src/main.ts')).toEqual(true);
        expect(ignore('/.vite')).toEqual(false);
        expect(ignore('/.vite/foo')).toEqual(false);
        expect(ignore('/package.json')).toEqual(false);
      });

      it('allows the node_modules directory itself but blocks unknown modules', async () => {
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('/node_modules')).toEqual(false);
        expect(ignore('/node_modules/typescript')).toEqual(true);
        expect(ignore('/node_modules/typescript/lib/typescript.js')).toEqual(
          true,
        );
      });

      it('blocks unknown modules through the ignore function', async () => {
        plugin = new VitePlugin(baseConfig);
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('/node_modules/unknown-pkg')).toEqual(true);
        expect(ignore('/node_modules/unknown-pkg/index.js')).toEqual(true);
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
});
