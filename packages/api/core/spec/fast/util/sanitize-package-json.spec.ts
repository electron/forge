import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readJson } from '@electron-forge/core-utils';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  defaultSanitizePackageJson,
  sanitizeCopiedPackageJson,
} from '../../../src/util/sanitize-package-json.js';

const fakeConfig = {
  pluginInterface: {
    triggerMutatingHook: vi.fn(),
    hasHook: vi.fn(),
  },
} as unknown as ResolvedForgeConfig;

beforeEach(() => {
  vi.mocked(fakeConfig.pluginInterface.triggerMutatingHook).mockImplementation(
    (_, arg1) => Promise.resolve(arg1),
  );
  vi.mocked(fakeConfig.pluginInterface.hasHook).mockReturnValue(false);
});

describe('defaultSanitizePackageJson', () => {
  it('strips dev-only fields and keeps runtime fields', () => {
    const sanitized = defaultSanitizePackageJson({
      name: 'my-app',
      productName: 'My App',
      version: '1.0.0',
      main: 'index.js',
      type: 'module',
      dependencies: { debug: '^4.0.0' },
      optionalDependencies: { fsevents: '^2.0.0' },
      peerDependencies: { electron: '*' },
      devDependencies: { vitest: '^4.0.0' },
      scripts: { start: 'electron-forge start' },
      workspaces: ['packages/*'],
      packageManager: 'yarn@4.0.0',
      resolutions: { debug: '4.1.0' },
      overrides: { debug: '4.1.0' },
      pnpm: { patchedDependencies: {} },
      private: true,
      publishConfig: { access: 'public' },
      devEngines: { node: '>=20' },
      jest: {},
      eslintConfig: {},
      prettier: {},
      browserslist: ['last 2 versions'],
      'lint-staged': {},
      'nano-staged': {},
      husky: {},
      commitlint: {},
      mocha: {},
      ava: {},
      nyc: {},
      c8: {},
      tap: {},
      xo: {},
      standard: {},
    });

    expect(sanitized).toEqual({
      name: 'my-app',
      productName: 'My App',
      version: '1.0.0',
      main: 'index.js',
      type: 'module',
      dependencies: { debug: '^4.0.0' },
      optionalDependencies: { fsevents: '^2.0.0' },
      peerDependencies: { electron: '*' },
    });
  });

  it('removes config.forge and drops config when empty', () => {
    const sanitized = defaultSanitizePackageJson({
      name: 'my-app',
      config: { forge: './forge.config.js' },
    });

    expect(sanitized).not.toHaveProperty('config');
  });

  it('keeps other config values when removing config.forge', () => {
    const sanitized = defaultSanitizePackageJson({
      name: 'my-app',
      config: { forge: './forge.config.js', other: true },
    });

    expect(sanitized.config).toEqual({ other: true });
  });
});

describe('sanitizeCopiedPackageJson', () => {
  let buildPath: string;

  beforeEach(async () => {
    buildPath = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'forge-sanitize-'),
    );

    return async () => {
      await fs.promises.rm(buildPath, { recursive: true, force: true });
    };
  });

  const writePackageJson = async (packageJson: Record<string, unknown>) => {
    await fs.promises.writeFile(
      path.join(buildPath, 'package.json'),
      JSON.stringify(packageJson),
    );
  };

  it('applies the default sanitizer when no hook is provided', async () => {
    await writePackageJson({
      name: 'my-app',
      main: 'index.js',
      dependencies: { debug: '^4.0.0' },
      devDependencies: { vitest: '^4.0.0' },
      scripts: { start: 'electron-forge start' },
      config: { forge: { packagerConfig: {} } },
    });

    await sanitizeCopiedPackageJson({ ...fakeConfig }, buildPath);

    expect(await readJson(path.join(buildPath, 'package.json'))).toEqual({
      name: 'my-app',
      main: 'index.js',
      dependencies: { debug: '^4.0.0' },
    });
  });

  it('replaces the default sanitizer with a hook from the forge config', async () => {
    await writePackageJson({
      name: 'my-app',
      devDependencies: { vitest: '^4.0.0' },
      scripts: { start: 'electron-forge start' },
    });

    const hook = vi.fn().mockImplementation(async (_config, packageJson) => {
      delete packageJson.scripts;
      return packageJson;
    });

    await sanitizeCopiedPackageJson(
      { ...fakeConfig, hooks: { sanitizePackageJson: hook } },
      buildPath,
    );

    expect(hook).toHaveBeenCalledOnce();
    // fields the default would strip survive when the user hook keeps them
    expect(await readJson(path.join(buildPath, 'package.json'))).toEqual({
      name: 'my-app',
      devDependencies: { vitest: '^4.0.0' },
    });
  });

  it('replaces the default sanitizer when a plugin provides the hook', async () => {
    await writePackageJson({
      name: 'my-app',
      devDependencies: { vitest: '^4.0.0' },
    });

    vi.mocked(fakeConfig.pluginInterface.hasHook).mockImplementation(
      (hookName) => hookName === 'sanitizePackageJson',
    );
    vi.mocked(
      fakeConfig.pluginInterface.triggerMutatingHook,
    ).mockImplementation(async (hookName, packageJson) =>
      hookName === 'sanitizePackageJson'
        ? { ...packageJson, sanitizedByPlugin: true }
        : packageJson,
    );

    await sanitizeCopiedPackageJson({ ...fakeConfig }, buildPath);

    expect(await readJson(path.join(buildPath, 'package.json'))).toEqual({
      name: 'my-app',
      devDependencies: { vitest: '^4.0.0' },
      sanitizedByPlugin: true,
    });
  });

  it('writes the value returned by the hook to disk', async () => {
    await writePackageJson({ name: 'my-app', main: 'index.js' });

    const hook = vi.fn().mockResolvedValue({ replaced: true });

    await sanitizeCopiedPackageJson(
      { ...fakeConfig, hooks: { sanitizePackageJson: hook } },
      buildPath,
    );

    expect(await readJson(path.join(buildPath, 'package.json'))).toEqual({
      replaced: true,
    });
  });
});
