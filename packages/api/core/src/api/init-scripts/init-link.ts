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
 * Uses the portal: protocol in package.json resolutions
 * to link the dependencies to the local workspace paths
 */
export async function initLink<T>(
  pm: PMDetails,
  dir: string,
  task?: ForgeListrTask<T>,
) {
  const shouldLink = process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
  if (shouldLink) {
    d('Linking forge dependencies');
    const packageJson = await readRawPackageJson(dir);
    const forgeRoot = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
    );

    const getWorkspacePath = (packageName: string): string => {
      const shortName = packageName.replace('@electron-forge/', '');

      if (shortName === 'cli' || shortName === 'core') {
        return path.join(forgeRoot, 'packages', 'api', shortName);
      }

      // Handle packages such as plugin-*, maker-*, publisher-*, template-*, utils-*
      const match = shortName.match(
        /^(plugin|maker|publisher|template|utils)-(.+)$/,
      );
      if (match) {
        const [, category, name] = match;
        return path.join(forgeRoot, 'packages', category, name);
      }

      // Handle utils packages with name mismatches
      if (shortName === 'shared-types') {
        return path.join(forgeRoot, 'packages', 'utils', 'types');
      }
      if (shortName === 'core-utils' || shortName === 'test-utils') {
        return path.join(forgeRoot, 'packages', 'utils', shortName);
      }

      throw new Error(`Unable to determine workspace path for ${packageName}`);
    };

    // populate our packagesToLink map
    const packagesToLink: Record<string, string> = {};
    for (const packageName of Object.keys(packageJson.devDependencies)) {
      if (packageName.startsWith('@electron-forge/')) {
        const workspacePath = getWorkspacePath(packageName);
        packagesToLink[packageName] = `portal:${workspacePath}`;
        d(`Found ${packageName}, will link to ${workspacePath}`);
      }
    }

    // get around link failures by using portal: resolutions
    if (Object.keys(packagesToLink).length > 0) {
      packageJson.resolutions = packageJson.resolutions || {};
      for (const [packageName, portalPath] of Object.entries(packagesToLink)) {
        packageJson.resolutions[packageName] = portalPath;
        d(`Adding resolution: ${packageName} -> ${portalPath}`);
      }

      await fs.promises.writeFile(
        path.join(dir, 'package.json'),
        JSON.stringify(packageJson, null, 2) + '\n',
      );
      // copy the root .yarnrc.yml to the target directory
      // ensure that the yarnPath is not included as it is a relative path
      if (pm.executable === 'yarn') {
        const rootYarnrc = path.join(forgeRoot, '.yarnrc.yml');
        const targetYarnrc = path.join(dir, '.yarnrc.yml');
        if (
          await fs.promises.access(rootYarnrc).then(
            () => true,
            () => false,
          )
        ) {
          const yarnrcContent = await fs.promises.readFile(rootYarnrc, 'utf-8');
          const filteredContent = yarnrcContent
            .split('\n')
            .filter((line) => !line.trim().startsWith('yarnPath:'))
            .join('\n');
          await fs.promises.writeFile(targetYarnrc, filteredContent);
          d(
            'Copied .yarnrc.yml (without yarnPath) to preserve config settings',
          );
        }
      }

      if (task) task.output = `${pm.executable} install`;
      d(`Running: ${pm.executable} install (cwd: ${dir})`);
      await spawnPackageManager(pm, ['install'], {
        cwd: dir,
      });
      d('Install completed successfully');
    }
    await fs.promises.chmod(
      path.resolve(dir, 'node_modules', '.bin', 'electron-forge'),
      0o755,
    );
  } else {
    d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
  }
}
