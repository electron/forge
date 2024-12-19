import path from 'node:path';

import { getPackageManager, isPnpm, packageManagerSpawn } from '@electron-forge/core-utils';
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
export async function initLink<T>(dir: string, task?: ForgeListrTask<T>) {
  const shouldLink = process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
  if (shouldLink) {
    d('Linking forge dependencies');
    const packageJson = await readRawPackageJson(dir);
    const packageManager = await getPackageManager();
    const linkFolder = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '.links');
    for (const packageName of Object.keys(packageJson.devDependencies)) {
      if (packageName.startsWith('@electron-forge/')) {
        if (task) {
          const _isPnpm = await isPnpm();
          if (_isPnpm) {
            task.output = `${packageManager} link ${linkFolder}/${packageName}`;
            await packageManagerSpawn(['link', `${linkFolder}/${packageName}`], {
              cwd: dir,
            });
          } else {
            task.output = `${packageManager} link --link-folder ${linkFolder} ${packageName}`;
            await packageManagerSpawn(['link', '--link-folder', linkFolder, packageName], {
              cwd: dir,
            });
          }
        }
      }
    }
  } else {
    d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
  }
}
