import fs from 'node:fs';
import path from 'node:path';

import { PMDetails, spawnPackageManager } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';

import { readRawPackageJson } from '../../util/read-package-json';

const d = debug('electron-forge:init:link');

/**
 * Link local forge dependencies
 *
 * This allows developers working on forge itself to easily init
 * a local template and have it use their local plugins / core / cli packages.
 *
 * Note: `yarn link:prepare` needs to run first before dependencies can be
 * linked.
 */
export async function initLink<T>(pm: PMDetails, dir: string, task?: ForgeListrTask<T>) {
  const shouldLink = process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
  if (shouldLink) {
    d('Linking forge dependencies');
    const packageJson = await readRawPackageJson(dir);
    // TODO(erickzhao): the `--link-folder` argument only works for `yarn`. Since this command is
    // only made for Forge contributors, it isn't a big deal if it doesn't work for other package managers,
    // but we should make it cleaner.
    const linkFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '.links');
    for (const packageName of Object.keys(packageJson.devDependencies)) {
      if (packageName.startsWith('@electron-forge/')) {
        if (task) task.output = `${pm.executable} link --link-folder ${linkFolder} ${packageName}`;
        await spawnPackageManager(pm, ['link', '--link-folder', linkFolder, packageName], {
          cwd: dir,
        });
      }
    }
    await fs.promises.chmod(path.resolve(dir, 'node_modules', '.bin', 'electron-forge'), 0o755);
  } else {
    d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
  }
}
