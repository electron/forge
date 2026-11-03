import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { installDependencies, readJson } from '@electron-forge/core-utils';
import baseTemplate from '@electron-forge/template-base';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  findExistingForgeConfig,
  forgeImport,
  toESModuleConfig,
} from '../../src/import.js';

// Stub out everything that would hit the network or run a package manager.
// Files are still written to a real temporary directory.
vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => ({
  ...(await importOriginal()),
  installDependencies: vi.fn(),
}));
// `resolvePackageManager` runs `<pm> --version` for a package manager found
// via lockfile. A Corepack shim refuses to run a package manager other than
// the one this repository is configured with, so never spawn one for real.
vi.mock('@malept/cross-spawn-promise', () => ({
  spawn: vi.fn().mockResolvedValue('10.0.0\n'),
}));

const templateConfigPath = path.resolve(
  baseTemplate.templateDir,
  'forge.config.js',
);

describe('import', () => {
  let dir: string;
  const originalUserAgent = process.env.npm_config_user_agent;

  const writePackageJSON = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overrides: Record<string, any> = {},
  ) => {
    await fs.promises.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify(
        {
          name: 'my-app',
          version: '1.0.0',
          main: 'main.js',
          devDependencies: { electron: '38.0.0' },
          ...overrides,
        },
        null,
        2,
      ),
    );
  };

  const readPackageJSON = () => readJson(path.join(dir, 'package.json'));

  const runImport = (options: Parameters<typeof forgeImport>[0] = {}) =>
    forgeImport({ dir, skipGit: true, interactive: false, ...options });

  beforeEach(async () => {
    vi.clearAllMocks();
    // The user agent set by the package manager running the tests must not
    // take precedence over the lockfile in the imported project.
    delete process.env.npm_config_user_agent;
    dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'forge-import-spec-'),
    );
    // Use npm unless a test says otherwise, so the package manager is never
    // resolved from this repository's own lockfile.
    await fs.promises.writeFile(path.join(dir, 'package-lock.json'), '{}');
  });

  afterEach(async () => {
    process.env.npm_config_user_agent = originalUserAgent;
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('keeps an existing release script', async () => {
    await writePackageJSON({
      scripts: { release: 'standard-version', make: 'old' },
    });

    await runImport();

    const { scripts } = await readPackageJSON();
    expect(scripts.release).toEqual('standard-version');
    expect(scripts.make).toEqual('electron-forge make');
  });

  it('writes the base template forge.config.js and the Forge scripts', async () => {
    await writePackageJSON({ scripts: { test: 'vitest' } });

    await runImport();

    const config = await fs.promises.readFile(
      path.join(dir, 'forge.config.js'),
      'utf8',
    );
    expect(config).toEqual(
      await fs.promises.readFile(templateConfigPath, 'utf8'),
    );
    expect(config).toContain('module.exports =');

    const packageJSON = await readPackageJSON();
    expect(packageJSON.scripts).toEqual({
      test: 'vitest',
      start: 'electron-forge start',
      package: 'electron-forge package',
      make: 'electron-forge make',
      release: 'electron-forge release',
    });
    expect(vi.mocked(installDependencies)).toHaveBeenCalled();
  });

  describe('ESM projects', () => {
    it('writes forge.config.js as an ES module when package.json has "type": "module"', async () => {
      await writePackageJSON({ type: 'module' });

      await runImport();

      const configPath = path.join(dir, 'forge.config.js');
      const config = await fs.promises.readFile(configPath, 'utf8');
      expect(config).not.toContain('require(');
      expect(config).not.toContain('module.exports');
      expect(config).toContain(
        "import { FusesPlugin } from '@electron-forge/plugin-fuses';",
      );
      expect(config).toContain('export default {');

      // Node must be able to load it as ESM. The plugin modules it imports
      // are stubbed out, since nothing is actually installed.
      for (const [name, body] of [
        ['@electron-forge/plugin-fuses', 'export class FusesPlugin {}'],
        [
          '@electron/fuses',
          'export const FuseV1Options = {}; export const FuseVersion = {};',
        ],
      ]) {
        const moduleDir = path.join(dir, 'node_modules', name);
        await fs.promises.mkdir(moduleDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(moduleDir, 'package.json'),
          JSON.stringify({ name, type: 'module', main: 'index.js' }),
        );
        await fs.promises.writeFile(path.join(moduleDir, 'index.js'), body);
      }
      const loaded = await import(pathToFileURL(configPath).toString());
      expect(loaded.default).toHaveProperty('makers');
      expect(loaded.default).toHaveProperty('plugins');
    });

    it('converts every require and the module.exports of the base template config', () => {
      const converted =
        toESModuleConfig(`const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require("node:path");

module.exports = {
  packagerConfig: {},
};
`);
      expect(converted)
        .toEqual(`import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from "node:path";

export default {
  packagerConfig: {},
};
`);
    });
  });

  describe('existing Forge configuration', () => {
    it.each(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'])(
      'keeps an existing forge.config%s and does not write forge.config.js',
      async (extension) => {
        await writePackageJSON();
        const existing = path.join(dir, `forge.config${extension}`);
        await fs.promises.writeFile(existing, '// my config\n');

        await runImport();

        expect(await fs.promises.readFile(existing, 'utf8')).toEqual(
          '// my config\n',
        );
        if (extension !== '.js') {
          expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toBe(false);
        }
        // Dependencies and scripts are still set up.
        expect((await readPackageJSON()).scripts.make).toEqual(
          'electron-forge make',
        );
        expect(vi.mocked(installDependencies)).toHaveBeenCalled();
      },
    );

    it('keeps an existing config.forge object in package.json untouched', async () => {
      const forge = { packagerConfig: { icon: 'icon' }, makers: [] };
      await writePackageJSON({ config: { forge } });

      await runImport();

      expect((await readPackageJSON()).config.forge).toEqual(forge);
      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toBe(false);
    });

    it('findExistingForgeConfig prefers package.json, then the first matching file', async () => {
      await expect(findExistingForgeConfig(dir, {})).resolves.toBeUndefined();
      await fs.promises.writeFile(path.join(dir, 'forge.config.ts'), '');
      await expect(findExistingForgeConfig(dir, {})).resolves.toEqual(
        'forge.config.ts',
      );
      await expect(
        findExistingForgeConfig(dir, { config: { forge: {} } }),
      ).resolves.toEqual('package.json');
      // A string only counts when the file it points to exists
      await expect(
        findExistingForgeConfig(dir, { config: { forge: './build/forge.js' } }),
      ).resolves.toEqual('forge.config.ts');
      await fs.promises.mkdir(path.join(dir, 'build'));
      await fs.promises.writeFile(path.join(dir, 'build', 'forge.js'), '');
      await expect(
        findExistingForgeConfig(dir, { config: { forge: './build/forge.js' } }),
      ).resolves.toEqual('./build/forge.js');
      await expect(
        findExistingForgeConfig(dir, { config: { forge: './build/forge' } }),
      ).resolves.toEqual('./build/forge');
    });
  });

  describe('package manager', () => {
    it('is resolved from the lockfile in the project directory, not the current directory', async () => {
      await writePackageJSON();
      await fs.promises.rm(path.join(dir, 'package-lock.json'));
      await fs.promises.writeFile(path.join(dir, 'pnpm-lock.yaml'), '');

      await runImport();

      const [pm, installDir] = vi.mocked(installDependencies).mock.calls[0];
      expect(pm.executable).toEqual('pnpm');
      expect(installDir).toEqual(dir);
    });

    it('prefers the lockfile in the project directory over the package manager running the command', async () => {
      await writePackageJSON();
      await fs.promises.rm(path.join(dir, 'package-lock.json'));
      await fs.promises.writeFile(path.join(dir, 'pnpm-lock.yaml'), '');
      // `npx create-electron-app import` always reports npm here
      process.env.npm_config_user_agent =
        'npm/10.9.2 node/v22.13.0 darwin arm64 workspaces/false';

      await runImport();

      expect(
        vi.mocked(installDependencies).mock.calls[0][0].executable,
      ).toEqual('pnpm');
    });

    it('does not write .yarnrc.yml for Yarn Classic', async () => {
      await writePackageJSON();

      await runImport({ packageManager: 'yarn@1.22.22' });

      expect(
        vi.mocked(installDependencies).mock.calls[0][0].executable,
      ).toEqual('yarn');
      expect(fs.existsSync(path.join(dir, '.yarnrc.yml'))).toBe(false);
    });

    it('writes .yarnrc.yml with nodeLinker: node-modules for Yarn Berry', async () => {
      await writePackageJSON();

      await runImport({ packageManager: 'yarn@4.9.0' });

      expect(
        await fs.promises.readFile(path.join(dir, '.yarnrc.yml'), 'utf8'),
      ).toContain('nodeLinker: node-modules');
    });
  });
});
