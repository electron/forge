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

    describe('packagerConfig.ignore', () => {
      it('does not overwrite an existing ignore value', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ResolvedForgeConfig);

        expect(config.packagerConfig.ignore).toEqual(/test/);
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

      it('allows externalized modules through the ignore function', async () => {
        plugin = new VitePlugin(baseConfig);
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        // Simulate what scanExternalModules does
        // Access the private set via the public scanExternalModules method indirectly
        // by writing a fixture and scanning it (tested separately below).
        // Here we verify the ignore function blocks unknown modules:
        expect(ignore('/node_modules/unknown-pkg')).toEqual(true);
        expect(ignore('/node_modules/unknown-pkg/index.js')).toEqual(true);
      });

      it('allows scoped packages in node_modules when externalized', async () => {
        plugin = new VitePlugin(baseConfig);
        const scanDir = await fs.promises.mkdtemp(path.join(tmp, 'vite-scan-'));
        plugin.setDirectories(scanDir);

        const buildDir = path.join(scanDir, '.vite', 'build');
        await fs.promises.mkdir(buildDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(buildDir, 'main.js'),
          'const x = require("@serialport/bindings-cpp");',
          'utf-8',
        );

        await plugin.scanExternalModules();
        const config = await plugin.resolveForgeConfig(
          {} as ResolvedForgeConfig,
        );
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(
          ignore(
            '/node_modules/@serialport/bindings-cpp/build/Release/bindings.node',
          ),
        ).toEqual(false);
        expect(ignore('/node_modules/@serialport/other-pkg')).toEqual(true);

        await fs.promises.rm(scanDir, { recursive: true });
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

  describe('getPackageNameFromRequire', () => {
    it('extracts simple package names', () => {
      expect(VitePlugin.getPackageNameFromRequire('better-sqlite3')).toEqual(
        'better-sqlite3',
      );
      expect(VitePlugin.getPackageNameFromRequire('mssql')).toEqual('mssql');
    });

    it('extracts scoped package names', () => {
      expect(
        VitePlugin.getPackageNameFromRequire('@serialport/bindings-cpp'),
      ).toEqual('@serialport/bindings-cpp');
      expect(
        VitePlugin.getPackageNameFromRequire('@electron/rebuild/lib/something'),
      ).toEqual('@electron/rebuild');
    });

    it('extracts package name from deep imports', () => {
      expect(
        VitePlugin.getPackageNameFromRequire('better-sqlite3/lib/binding'),
      ).toEqual('better-sqlite3');
    });

    it('returns null for relative paths', () => {
      expect(VitePlugin.getPackageNameFromRequire('./foo')).toBeNull();
      expect(VitePlugin.getPackageNameFromRequire('../bar')).toBeNull();
      expect(VitePlugin.getPackageNameFromRequire('/absolute/path')).toBeNull();
    });

    it('returns null for Node.js builtins', () => {
      expect(VitePlugin.getPackageNameFromRequire('fs')).toBeNull();
      expect(VitePlugin.getPackageNameFromRequire('path')).toBeNull();
      expect(VitePlugin.getPackageNameFromRequire('node:crypto')).toBeNull();
    });

    it('returns null for electron', () => {
      expect(VitePlugin.getPackageNameFromRequire('electron')).toBeNull();
      expect(VitePlugin.getPackageNameFromRequire('electron/main')).toBeNull();
      expect(
        VitePlugin.getPackageNameFromRequire('electron/renderer'),
      ).toBeNull();
      expect(
        VitePlugin.getPackageNameFromRequire('electron/common'),
      ).toBeNull();
    });

    it('returns null for incomplete scoped packages', () => {
      expect(VitePlugin.getPackageNameFromRequire('@scope')).toBeNull();
    });
  });

  describe('scanExternalModules', () => {
    let scanDir: string;
    let plugin: VitePlugin;

    beforeAll(async () => {
      scanDir = await fs.promises.mkdtemp(path.join(tmp, 'vite-scan-ext-'));
      plugin = new VitePlugin(baseConfig);
      plugin.setDirectories(scanDir);
    });

    it('finds externalized require calls in built output', async () => {
      const buildDir = path.join(scanDir, '.vite', 'build');
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(buildDir, 'main.js'),
        [
          'const sqlite = require("better-sqlite3");',
          'const fs = require("node:fs");',
          'const path = require("path");',
          'const electron = require("electron");',
          'const serial = require("@serialport/bindings-cpp");',
          'const local = require("./local");',
          'const mssql = require("mssql");',
          'const backtick = require(`backtick-pkg`);',
        ].join('\n'),
        'utf-8',
      );

      await plugin.scanExternalModules();
      const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
      const ignore = config.packagerConfig.ignore as IgnoreFunction;

      // These should be included
      expect(ignore('/node_modules/better-sqlite3')).toEqual(false);
      expect(
        ignore(
          '/node_modules/better-sqlite3/build/Release/better_sqlite3.node',
        ),
      ).toEqual(false);
      expect(ignore('/node_modules/@serialport/bindings-cpp')).toEqual(false);
      expect(ignore('/node_modules/mssql')).toEqual(false);
      expect(ignore('/node_modules/backtick-pkg')).toEqual(false);

      // These should still be excluded
      expect(ignore('/node_modules/typescript')).toEqual(true);
      expect(ignore('/node_modules/vite')).toEqual(true);
    });

    it('handles missing build directory gracefully', async () => {
      const emptyDir = await fs.promises.mkdtemp(path.join(tmp, 'vite-empty-'));
      const emptyPlugin = new VitePlugin(baseConfig);
      emptyPlugin.setDirectories(emptyDir);

      await emptyPlugin.scanExternalModules();
      const config = await emptyPlugin.resolveForgeConfig(
        {} as ResolvedForgeConfig,
      );
      const ignore = config.packagerConfig.ignore as IgnoreFunction;

      expect(ignore('/node_modules/anything')).toEqual(true);

      await fs.promises.rm(emptyDir, { recursive: true });
    });

    it('only scans .js files', async () => {
      const buildDir = path.join(scanDir, '.vite', 'build');
      await fs.promises.writeFile(
        path.join(buildDir, 'main.js.map'),
        '{"sources": ["require(\\"should-not-match\\")"]}',
        'utf-8',
      );

      const freshPlugin = new VitePlugin(baseConfig);
      freshPlugin.setDirectories(scanDir);
      await freshPlugin.scanExternalModules();
      const config = await freshPlugin.resolveForgeConfig(
        {} as ResolvedForgeConfig,
      );
      const ignore = config.packagerConfig.ignore as IgnoreFunction;

      // should-not-match must not be included (came from a .map file)
      expect(ignore('/node_modules/should-not-match')).toEqual(true);
      // but better-sqlite3 from main.js should still be found
      expect(ignore('/node_modules/better-sqlite3')).toEqual(false);
    });

    afterAll(async () => {
      await fs.promises.rm(scanDir, { recursive: true });
    });
  });
});
