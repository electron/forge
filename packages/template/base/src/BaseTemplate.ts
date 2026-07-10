import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
// Namespace import so that older Node.js versions without
// `stripTypeScriptTypes` fail in the guard below instead of at load time.
import * as nodeModule from 'node:module';
import path from 'node:path';

import {
  readJson,
  readJsonSync,
  resolvePackageManager,
  writeJson,
} from '@electron-forge/core-utils';
import {
  ForgeListrTaskDefinition,
  ForgeTemplate,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import debug from 'debug';
import { format } from 'oxfmt';
import semver from 'semver';

import determineAuthor from './determine-author.js';

const currentForgeVersion = readJsonSync(
  path.resolve(import.meta.dirname, '../package.json'),
).version;

const d = debug('electron-forge:template:base');
const tmplDir = path.resolve(import.meta.dirname, '../tmpl');

export class BaseTemplate implements ForgeTemplate {
  public templateDir = tmplDir;

  public requiredForgeVersion = currentForgeVersion;

  get dependencies(): string[] {
    const packageJSONPath = path.join(this.templateDir, 'package.json');
    if (existsSync(packageJSONPath)) {
      const deps = readJsonSync(packageJSONPath).dependencies;
      if (deps) {
        return Object.entries(deps).map(([packageName, version]) => {
          if (version === 'ELECTRON_FORGE/VERSION') {
            version = `^${currentForgeVersion}`;
          }
          return `${packageName}@${version}`;
        });
      }
    }

    return [];
  }

  get devDependencies(): string[] {
    const packageJSONPath = path.join(this.templateDir, 'package.json');
    if (existsSync(packageJSONPath)) {
      const packageDevDeps = readJsonSync(packageJSONPath).devDependencies;
      if (packageDevDeps) {
        return Object.entries(packageDevDeps).map(([packageName, version]) => {
          if (version === 'ELECTRON_FORGE/VERSION') {
            version = `^${currentForgeVersion}`;
          }
          return `${packageName}@${version}`;
        });
      }
    }

    return [];
  }

  getDevDependencies(_options: InitTemplateOptions): string[] {
    return this.devDependencies;
  }

  public async initializeTemplate(
    directory: string,
    { copyCIFiles, typescript }: InitTemplateOptions,
  ): Promise<ForgeListrTaskDefinition[]> {
    // The base template only ships JavaScript starter files and ignores the
    // `typescript` flag. Reject here rather than in `init` so the guard holds
    // no matter how the template was resolved (`base`,
    // `@electron-forge/template-base`, etc.). The `vite`/`webpack` subclasses
    // honor the flag and override `templateDir`, so this only trips for a
    // direct base-template scaffold, not their `super.initializeTemplate` calls.
    if (typescript && this.templateDir === tmplDir) {
      throw new Error(
        'The "base" template does not support TypeScript. Use "--template vite" or "--template webpack" with "--typescript".',
      );
    }

    return [
      {
        title: 'Copying starter files',
        task: async () => {
          const pm = await resolvePackageManager();
          d('creating directory:', path.resolve(directory, 'src'));
          await fs.mkdir(path.resolve(directory, 'src'), { recursive: true });
          const rootFiles = ['_gitignore', 'forge.config.js'];

          if (pm.executable === 'pnpm') {
            rootFiles.push('pnpm-workspace.yaml');
          } else if (
            // Support Yarn 2+ by default by initializing with nodeLinker: node-modules
            pm.executable === 'yarn' &&
            pm.version &&
            (pm.version === 'latest' || semver.gte(pm.version, '2.0.0'))
          ) {
            rootFiles.push('_yarnrc.yml');
          }

          if (copyCIFiles) {
            d(
              `Copying CI files is currently not supported - this will be updated in a later version of Forge`,
            );
          }

          const srcFiles = [
            'index.css',
            'index.js',
            'index.html',
            'preload.js',
          ];

          for (const file of rootFiles) {
            await this.copy(
              path.resolve(tmplDir, file),
              path.resolve(directory, file.replace(/^_/, '.')),
            );
          }
          for (const file of srcFiles) {
            await this.copy(
              path.resolve(tmplDir, file),
              path.resolve(directory, 'src', file),
            );
          }
        },
      },
      {
        title: 'Initializing package.json',
        task: async () => {
          await this.initializePackageJSON(directory);
        },
      },
    ];
  }

  async copy(source: string, target: string): Promise<void> {
    d(`copying "${source}" --> "${target}"`);
    await fs.cp(source, target, { recursive: true });
  }

  async writeLintConfig(directory: string): Promise<void> {
    await this.copyTemplateFile(directory, '.oxlintrc.json');
    await this.copy(
      path.join(tmplDir, '.oxfmtrc.json'),
      path.resolve(directory, '.oxfmtrc.json'),
    );
  }

  async copyTemplateFile(destDir: string, basename: string): Promise<void> {
    await this.copy(
      path.join(this.templateDir, basename),
      path.resolve(destDir, basename),
    );
  }

  async initializePackageJSON(directory: string): Promise<void> {
    const packageJSON = await readJson(
      path.resolve(import.meta.dirname, '../tmpl/package.json'),
    );

    // Merge fields from the subclass template's package.json
    if (this.templateDir !== tmplDir) {
      const templatePackageJSONPath = path.join(
        this.templateDir,
        'package.json',
      );
      if (existsSync(templatePackageJSONPath)) {
        const templatePackageJSON = await readJson(templatePackageJSONPath);
        const { dependencies, devDependencies, scripts, ...rest } =
          templatePackageJSON;
        Object.assign(packageJSON, rest);
        if (scripts) {
          packageJSON.scripts = { ...packageJSON.scripts, ...scripts };
        }
      }
    }

    packageJSON.productName = packageJSON.name = path
      .basename(directory)
      .toLowerCase();
    packageJSON.author = await determineAuthor(directory);

    const pm = await resolvePackageManager();

    if (pm.executable === 'pnpm') {
      // Ensures we're using the same `pnpm` version that we use in CI.
      packageJSON.devEngines = {
        packageManager: 'pnpm@11.10.0',
      };

      // Ensures all transitive dependencies for `electron-winstaller` are
      // installed to `node_modules/electron-winstaller/node_modules` instead of
      // being hoisted to `node_modules`; otherwise, `jiti` fails to load
      // `forge.config.ts` because it can't locate the transitive dependencies
      // for `electron-winstaller` (loaded via `@electron-forge/maker-squirrel`)
      // in the root `node_modules` folder.
      packageJSON.peerDependencies = {
        ...packageJSON.peerDependencies,
        'electron-winstaller': '^5.4.0',
      };
    }

    if (!packageJSON.scripts.lint) {
      packageJSON.scripts.lint = 'echo "No linting configured"';
    }

    d('writing package.json to:', directory);
    await writeJson(path.resolve(directory, 'package.json'), packageJSON, {
      spaces: 2,
    });
  }

  async stripAndRename(srcPath: string, destPath: string): Promise<void> {
    // `stripTypeScriptTypes` is only available in Node.js >= 22.13, and
    // `npx create-electron-app` does not enforce the `engines` field.
    if (typeof nodeModule.stripTypeScriptTypes !== 'function') {
      throw new Error(
        `Generating JavaScript template files requires Node.js >= 22.13 (currently running ${process.version}).`,
      );
    }
    const source = await fs.readFile(srcPath, 'utf8');
    const stripped = nodeModule.stripTypeScriptTypes(source, {
      mode: 'strip',
    });
    await this.writeFormattedFile(destPath, stripped);
    if (srcPath !== destPath) {
      await fs.rm(srcPath, { force: true });
    }
  }

  async formatFile(filePath: string): Promise<void> {
    const source = await fs.readFile(filePath, 'utf8');
    await this.writeFormattedFile(filePath, source);
  }

  private async writeFormattedFile(
    filePath: string,
    source: string,
  ): Promise<void> {
    const oxfmtConfig = readJsonSync(path.join(tmplDir, '.oxfmtrc.json'));
    const formatted = await format(filePath, source, oxfmtConfig);
    if (formatted.errors.length > 0) {
      throw new Error(
        `Failed to format template file "${filePath}":\n${formatted.errors
          .map((error) => error.message)
          .join('\n')}`,
      );
    }
    await fs.writeFile(filePath, formatted.code);
  }

  async updateFileByLine(
    inputPath: string,
    lineHandler: (line: string) => string | null,
    outputPath?: string | undefined,
  ): Promise<void> {
    const destPath = outputPath || inputPath;
    const fileContents = (await fs.readFile(inputPath, 'utf8'))
      .split('\n')
      .map(lineHandler)
      .filter((line): line is string => line !== null)
      .join('\n');
    await fs.writeFile(destPath, fileContents);
    if (outputPath !== undefined) {
      await fs.rm(inputPath, { recursive: true, force: true });
    }
    await this.formatFile(destPath);
  }
}

export default new BaseTemplate();
