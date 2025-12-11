import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { PMDetails, spawnPackageManager } from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';

import { readRawPackageJson } from '../../util/read-package-json';

import { deps, devDeps } from './init-npm';

const d = debug('electron-forge:init:link');

/**
 * Fetches the workspace path for each `@electron-forge/` package in the monorepo
 * @param forgeRoot - Absolute path to the local `electron/forge` checkout
 * @param packageName - Name of the `@electron-forge/` package
 * @returns The absolute path of the package according to the `yarn workspace` command
 */
const getWorkspacePath = (forgeRoot: string, packageName: string): string => {
  const result = spawnSync('yarn', ['workspace', packageName, 'exec', 'pwd'], {
    cwd: forgeRoot,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    d(`Failed to get workspace path for ${packageName}: ${result.stderr}`);
    throw new Error(`Unable to determine workspace path for ${packageName}`);
  }

  const workspacePath = result.stdout.trim();
  return workspacePath;
};

/**
 * Link `@electron-forge/` dependencies from a local checkout of the electron/forge repo.
 *
 * This allows developers working on Forge itself to easily init
 * a local template and have it use their local build.
 *
 * Uses the `file:` protocol to point dependencies to the correct local checkout.
 */
export async function initLink<T>(
  pm: PMDetails,
  dir: string,
  task?: ForgeListrTask<T>,
) {
  const forgeRootPath = process.env.LINK_FORGE_DEPENDENCIES_ON_INIT;
  if (forgeRootPath) {
    d('Linking local Forge dependencies');
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJson = await readRawPackageJson(dir);

    const forgeRoot = path.resolve(process.cwd(), forgeRootPath);
    d(`Forge root resolved to: ${forgeRoot}`);

    // Read the Forge root's package.json to check what's available
    const forgePackageJson = await readRawPackageJson(forgeRoot);
    const forgeNodeModules = path.join(forgeRoot, 'node_modules');

    // Ensure target package.json has dependency objects
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }

    /**
     * Attempts to use
     * @param packageName - name of the package to link
     * @param isDevDep - if the dependency belongs in devDependencies or not
     * @returns
     */
    const linkPackage = (
      packageName: string,
      isDevDep: boolean,
    ): { type: 'workspace' | 'node_modules' | 'version'; value: string } => {
      // 1. @electron-forge packages -> link to workspace in `electron/forge` monorepo
      if (packageName.startsWith('@electron-forge/')) {
        const workspacePath = getWorkspacePath(forgeRoot, packageName);
        const relativePath = path.relative(dir, workspacePath);
        return { type: 'workspace', value: `file:${relativePath}` };
      }

      // 2. link to Forge's `node_modules` if possible
      const versionInForgeRoot =
        forgePackageJson.dependencies?.[packageName] ||
        forgePackageJson.devDependencies?.[packageName];

      if (versionInForgeRoot) {
        return { type: 'node_modules', value: versionInForgeRoot };
      }

      // 3. Otherwise, use version from init-npm arrays
      const depList = isDevDep ? devDeps : deps;
      for (const dep of depList) {
        const match = dep.match(/^(@?[^@]+)@(.+)$/);
        if (match) {
          const [, depName, version] = match;
          if (depName === packageName) {
            return { type: 'version', value: version };
          }
        }
      }

      // 4. Fall back to latest version of dep
      return { type: 'version', value: 'latest' };
    };

    const baseTemplateForgeDeps = [
      '@electron-forge/cli',
      '@electron-forge/maker-squirrel',
      '@electron-forge/maker-zip',
      '@electron-forge/maker-deb',
      '@electron-forge/maker-rpm',
      '@electron-forge/plugin-auto-unpack-natives',
      '@electron-forge/plugin-fuses',
    ];

    for (const packageName of baseTemplateForgeDeps) {
      if (!packageJson.devDependencies[packageName]) {
        const link = linkPackage(packageName, true);
        packageJson.devDependencies[packageName] = link.value;
        d(`Adding ${packageName} via ${link.type}: ${link.value}`);
      }
    }

    // Add non-forge production dependencies from init-npm
    for (const dep of deps) {
      const match = dep.match(/^(@?[^@]+)@?(.*)$/);
      if (match) {
        const [, packageName] = match;
        if (!packageJson.dependencies[packageName]) {
          const link = linkPackage(packageName, false);
          packageJson.dependencies[packageName] = link.value;
          d(
            `Adding production dependency ${packageName} via ${link.type}: ${link.value}`,
          );
        }
      }
    }

    // Add non-forge dev dependencies from init-npm (skip forge packages)
    for (const dep of devDeps) {
      const match = dep.match(/^(@?[^@]+)@(.+)$/);
      if (match) {
        const [, packageName] = match;
        if (!packageName.startsWith('@electron-forge/')) {
          if (!packageJson.devDependencies[packageName]) {
            const link = linkPackage(packageName, true);
            packageJson.devDependencies[packageName] = link.value;
            d(
              `Adding dev dependency ${packageName} via ${link.type}: ${link.value}`,
            );
          }
        }
      }
    }

    // Handle electron specially to use exact version from Forge
    const electronVersionFromForge = forgePackageJson.devDependencies?.electron;
    if (electronVersionFromForge) {
      // Check if electron is in node_modules
      const electronNodeModulePath = path.join(forgeNodeModules, 'electron');
      if (fs.existsSync(electronNodeModulePath)) {
        const relativePath = path.relative(dir, electronNodeModulePath);
        packageJson.devDependencies['electron'] = `file:${relativePath}`;
        d(`Linking electron from Forge node_modules: file:${relativePath}`);
      } else {
        packageJson.devDependencies['electron'] = electronVersionFromForge;
        d(
          `Using electron version from Forge checkout: ${electronVersionFromForge}`,
        );
      }
    }

    // Write updated package.json
    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8',
    );
    d('Updated package.json with file: protocol dependencies and common deps');

    // Copy the root .yarnrc.yml to the target directory before installing
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

    if (task) task.output = `${pm.executable} install`;
    d(`Running: ${pm.executable} install (cwd: ${dir})`);
    await spawnPackageManager(pm, ['install'], {
      cwd: dir,
    });
    d('Install completed successfully');
    await fs.promises.chmod(
      path.resolve(dir, 'node_modules', '.bin', 'electron-forge'),
      0o755,
    );
  } else {
    d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
  }
}
