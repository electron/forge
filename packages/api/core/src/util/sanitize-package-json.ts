import path from 'node:path';

import { writeJson } from '@electron-forge/core-utils';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';

import { runMutatingHook } from './hook.js';
import { readMutatedPackageJson } from './read-package-json.js';

const DEFAULT_STRIPPED_FIELDS = [
  'devDependencies',
  'scripts',
  'workspaces',
  'packageManager',
  'resolutions',
  'overrides',
  'pnpm',
  'private',
  'publishConfig',
  'devEngines',
  'jest',
  'eslintConfig',
  'prettier',
  'browserslist',
  'lint-staged',
  'nano-staged',
  'husky',
  'commitlint',
  'mocha',
  'ava',
  'nyc',
  'c8',
  'tap',
  'xo',
  'standard',
];

/**
 * The default implementation of the `sanitizePackageJson` hook. Strips
 * development-only fields (`devDependencies`, `scripts`, workspace and
 * package manager settings, and common tooling configuration) from the
 * packaged app's package.json, removes `config.forge`, and drops `config`
 * entirely if it is empty afterwards. Runtime-relevant fields such as `main`,
 * `dependencies`, and `optionalDependencies` are kept.
 *
 * Custom `sanitizePackageJson` hooks can call this function to extend the
 * default behavior rather than replace it.
 */
export function defaultSanitizePackageJson(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageJson: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  for (const field of DEFAULT_STRIPPED_FIELDS) {
    delete packageJson[field];
  }
  if (packageJson.config) {
    delete packageJson.config.forge;
    if (Object.keys(packageJson.config).length === 0) {
      delete packageJson.config;
    }
  }
  return packageJson;
}

/**
 * Rewrites the package.json that was copied into `buildPath`, running any
 * `sanitizePackageJson` hooks provided by the Forge config or plugins, or
 * {@link defaultSanitizePackageJson} when none are provided.
 */
export async function sanitizeCopiedPackageJson(
  forgeConfig: ResolvedForgeConfig,
  buildPath: string,
): Promise<void> {
  const packageJson = await readMutatedPackageJson(buildPath, forgeConfig);
  const hasUserHook =
    typeof forgeConfig.hooks?.sanitizePackageJson === 'function' ||
    forgeConfig.pluginInterface.hasHook('sanitizePackageJson');
  const sanitized = hasUserHook
    ? await runMutatingHook(forgeConfig, 'sanitizePackageJson', packageJson)
    : defaultSanitizePackageJson(packageJson);
  await writeJson(path.resolve(buildPath, 'package.json'), sanitized, {
    spaces: 2,
  });
}
