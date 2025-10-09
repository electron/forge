import { spawnSync } from 'node:child_process';
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
 * Uses yarn link to create portal: resolutions that point to local workspace paths.
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
      const result = spawnSync(
        'yarn',
        ['workspace', packageName, 'exec', 'pwd'],
        {
          cwd: forgeRoot,
          encoding: 'utf-8',
          shell: process.platform === 'win32',
        },
      );

      if (result.status !== 0) {
        d(`Failed to get workspace path for ${packageName}: ${result.stderr}`);
        throw new Error(
          `Unable to determine workspace path for ${packageName}`,
        );
      }

      const workspacePath = result.stdout.trim();
      return workspacePath;
    };

    // Collect all @electron-forge packages and their workspace paths
    const packagesToLink: Record<string, string> = {};
    for (const packageName of Object.keys(packageJson.devDependencies)) {
      if (packageName.startsWith('@electron-forge/')) {
        const workspacePath = getWorkspacePath(packageName);
        packagesToLink[packageName] = workspacePath;
        d(`Found ${packageName}, will link to ${workspacePath}`);
      }
    }

    // Use yarn link to create portal: resolutions for local packages
    if (Object.keys(packagesToLink).length > 0) {
      // Copy the root .yarnrc.yml to the target directory before linking
      // This ensures settings like npmMinimalAgeGate are preserved
      if (pm.executable === 'yarn') {
        const rootYarnrc = path.join(forgeRoot, '.yarnrc.yml');
        const targetYarnrc = path.join(dir, '.yarnrc.yml');
        if (fs.existsSync(rootYarnrc)) {
          const yarnrcContent = await fs.promises.readFile(rootYarnrc, 'utf-8');
          // we create a new yarnrc.yml (without yarnPath and enableScripts) and yarn.lock to mark as separate project
          // this avoids issues with yarnPath and enableScripts in CI

          const filteredContent = yarnrcContent
            .split('\n')
            .filter(
              (line) =>
                !line.trim().startsWith('yarnPath:') &&
                !line.trim().startsWith('enableScripts:'),
            )
            .join('\n');
          await fs.promises.writeFile(targetYarnrc, filteredContent);
          d('Copied .yarnrc.yml (without yarnPath/enableScripts)');

          const targetYarnLock = path.join(dir, 'yarn.lock');
          if (!fs.existsSync(targetYarnLock)) {
            await fs.promises.writeFile(targetYarnLock, '');
            d('Created empty yarn.lock to mark as separate project');
          }
        }
      }

      const paths = Object.values(packagesToLink);
      if (task) task.output = `${pm.executable} link ${paths.length} packages`;
      d(`Linking ${paths.length} packages`);
      await spawnPackageManager(pm, ['link', ...paths], {
        cwd: dir,
      });
      d('Linking completed successfully');

      // an additional install is needed to resolve any remaining dependencies
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
