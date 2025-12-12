import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { PMDetails, spawnPackageManager } from '@electron-forge/core-utils';
import { ForgeListrTask, ForgeTemplate } from '@electron-forge/shared-types';
import debug from 'debug';

import { readRawPackageJson } from '../../util/read-package-json';

import {
  deps as commonDeps,
  devDeps as commonDevDeps,
  exactDevDeps as commonExactDevDeps,
} from './init-npm';

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
  forgeRootPath: string,
  templateModule: ForgeTemplate,
  pm: PMDetails,
  dir: string,
  task?: ForgeListrTask<T>,
) {
  if (forgeRootPath) {
    d('Linking local Forge dependencies');
    const packageJsonPath = path.join(dir, 'package.json');
    const packageJson = await readRawPackageJson(dir);

    // Use realpathSync to resolve symlinks (e.g., /tmp -> /private/tmp on macOS)
    // This ensures relative paths work correctly across symlinked directories
    const forgeRoot = fs.realpathSync(
      path.resolve(process.cwd(), forgeRootPath),
    );
    const realDir = fs.realpathSync(dir);
    d(`Forge root resolved to: ${forgeRoot}`);
    d(`Target dir resolved to: ${realDir}`);

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
     * Attempts to link a package to the local checkout of `electron/forge`
     * via the `file:` protocol. This takes a few different strategies:
     *
     * 1. All `@electron-forge/` deps should use the `dist/` generated in the local checkout
     * 2. Other deps that Forge uses should be linked from the checkout's `node_modules` folder
     * 3. If no `file:` linking is possible, get the version from the `templateModule` object
     * 4. Otherwise, get it from the common dependencies array
     *
     * If none of these strategies work, we throw an error.
     *
     * @param packageName - name of the package to link
     * @param isDevDep - if the dependency belongs in `devDependencies` (or `dependencies`)
     * @returns the version to install
     */
    // Use portal: protocol for Yarn workspace packages (resolves transitive deps properly)
    // Use file: protocol for everything else (npm/pnpm, and node_modules packages)
    const workspaceProtocol = pm.executable === 'yarn' ? 'portal:' : 'file:';

    const linkPackage = (packageName: string, isDevDep: boolean): string => {
      // 1. @electron-forge packages -> link to workspace in `electron/forge` monorepo
      if (packageName.startsWith('@electron-forge/')) {
        const workspacePath = getWorkspacePath(forgeRoot, packageName);
        const relativePath = path.relative(realDir, workspacePath);
        const value = `${workspaceProtocol}${relativePath}`;
        d(`Linking ${packageName} via monorepo workspace: ${value}`);
        return value;
      }

      // 2. link to Forge's `node_modules` if possible (always use file: protocol)
      const versionInForgeRoot: string | undefined =
        forgePackageJson.dependencies?.[packageName] ||
        forgePackageJson.devDependencies?.[packageName];

      if (typeof versionInForgeRoot === 'string') {
        const pathInNodeModules = path.join(forgeNodeModules, packageName);
        if (fs.existsSync(pathInNodeModules)) {
          const relativePath = path.relative(realDir, pathInNodeModules);
          const value = `file:${relativePath}`;
          d(`Linking ${packageName} via Forge's local node_modules: ${value}`);
          return value;
        } else {
          throw new Error(
            `Package ${packageName} was listed in Forge's package.json but does not exist under ${pathInNodeModules}`,
          );
        }
      }

      // 3. Check templateModule dependencies for version
      const templateDepList = isDevDep
        ? templateModule.devDependencies
        : templateModule.dependencies;
      // TODO: this would be easier to work with if we made template deps a Record<string, string> instead of an array?
      if (templateDepList) {
        for (const dep of templateDepList) {
          const match = dep.match(/^(@?[^@]+)@(.+)$/);
          if (match) {
            const [, depName, version] = match;
            if (depName === packageName) {
              d(
                `Installing ${packageName} via the template's dependencies: ${version}`,
              );
              return version;
            }
          }
        }
      }

      // 4. Otherwise, use version from init-npm arrays
      const depList = isDevDep ? commonDevDeps : commonDeps;
      for (const dep of depList) {
        const match = dep.match(/^(@?[^@]+)@(.+)$/);
        if (match) {
          const [, depName, version] = match;
          if (depName === packageName) {
            d(
              `Installing ${packageName} via the Forge's common dependencies: ${version}`,
            );
            return version;
          }
        }
      }

      throw new Error(
        'Could not link dependency based on Forge workspace, Forge node_modules, or template dependency arrays',
      );
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
        packageJson.devDependencies[packageName] = linkPackage(
          packageName,
          true,
        );
      }
    }

    // Add template-specific dependencies
    if (Array.isArray(templateModule.dependencies)) {
      for (const packageName of templateModule.dependencies) {
        if (!packageJson.dependencies[packageName]) {
          packageJson.dependencies[packageName] = linkPackage(
            packageName,
            false,
          );
        }
      }
    }
    if (Array.isArray(templateModule.devDependencies)) {
      for (const packageName of templateModule.devDependencies) {
        if (!packageJson.devDependencies[packageName]) {
          packageJson.devDependencies[packageName] = linkPackage(
            packageName,
            true,
          );
        }
      }
    }

    // Non-forge common deps are listed in `init-npm.ts`
    for (const dep of commonDeps) {
      const match = dep.match(/^(@?[^@]+)@?(.*)$/);
      if (match) {
        const [, packageName] = match;
        if (!packageJson.dependencies[packageName]) {
          packageJson.dependencies[packageName] = linkPackage(
            packageName,
            false,
          );
        }
      }
    }
    for (const dep of commonDevDeps) {
      const match = dep.match(/^(@?[^@]+)@(.+)$/);
      if (match) {
        const [, packageName] = match;
        if (!packageName.startsWith('@electron-forge/')) {
          if (!packageJson.devDependencies[packageName]) {
            packageJson.devDependencies[packageName] = linkPackage(
              packageName,
              true,
            );
          }
        }
      }
    }

    for (const packageName of commonExactDevDeps) {
      if (!packageJson.devDependencies[packageName]) {
        packageJson.devDependencies[packageName] = linkPackage(
          packageName,
          true,
        );
      }
    }

    // Add yarn resolutions to ensure workspace:* references resolve correctly
    if (pm.executable === 'yarn') {
      const workspacesResult = spawnSync(
        'yarn',
        ['workspaces', 'list', '--json'],
        {
          cwd: forgeRoot,
          encoding: 'utf-8',
          shell: process.platform === 'win32',
        },
      );

      if (workspacesResult.status !== 0) {
        throw new Error(
          `Failed to list yarn workspaces: ${workspacesResult.stderr}`,
        );
      }

      // Parse NDJSON output (one JSON object per line)
      const workspacePackages = workspacesResult.stdout
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as { name: string; location: string })
        .filter((ws) => ws.name.startsWith('@electron-forge/'));

      const resolutions: Record<string, string> = {};
      for (const ws of workspacePackages) {
        const workspacePath = path.join(forgeRoot, ws.location);
        const relativePath = path.relative(realDir, workspacePath);
        resolutions[ws.name] = `${workspaceProtocol}${relativePath}`;
      }

      packageJson.resolutions = resolutions;
      d(
        `Added yarn resolutions for ${workspacePackages.length} Forge packages`,
      );
    }

    // Add pnpm overrides to ensure workspace:* references resolve correctly
    if (pm.executable === 'pnpm') {
      const workspacesResult = spawnSync(
        'yarn',
        ['workspaces', 'list', '--json'],
        {
          cwd: forgeRoot,
          encoding: 'utf-8',
          shell: process.platform === 'win32',
        },
      );

      if (workspacesResult.status !== 0) {
        throw new Error(
          `Failed to list yarn workspaces: ${workspacesResult.stderr}`,
        );
      }

      // Parse NDJSON output (one JSON object per line)
      const workspacePackages = workspacesResult.stdout
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as { name: string; location: string })
        .filter((ws) => ws.name.startsWith('@electron-forge/'));

      const overrides: Record<string, string> = {};
      for (const ws of workspacePackages) {
        const workspacePath = path.join(forgeRoot, ws.location);
        const relativePath = path.relative(realDir, workspacePath);
        overrides[ws.name] = `${workspaceProtocol}${relativePath}`;
      }

      packageJson.pnpm = {
        onlyBuiltDependencies: ['electron', 'electron-winstaller'],
        overrides,
      };
      d(`Added pnpm.overrides for ${workspacePackages.length} Forge packages`);
    }

    d(
      'Updating package.json with file: protocol dependencies wherever possible',
    );
    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8',
    );

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
    d(`Installing all dependencies (Running: ${pm.executable} install)`);
    // FIXME: this fails without `--ignore-scripts` because `@electron/fuses` because there's a `prepare` script
    const args = ['install'];
    if (pm.executable === 'npm') {
      args.push('--ignore-scripts');
    }
    await spawnPackageManager(pm, args, {
      cwd: dir,
    });
    await fs.promises.chmod(
      path.resolve(dir, 'node_modules', '.bin', 'electron-forge'),
      0o755,
    );
    d('Install completed successfully');
  } else {
    d('LINK_FORGE_DEPENDENCIES_ON_INIT is falsy. Skipping.');
  }
}
