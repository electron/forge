import path from 'node:path';

import { resolvePackageManager } from '@electron-forge/core-utils';
import { ForgeListrTaskDefinition, ForgeTemplate, InitTemplateOptions } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';

import determineAuthor from './determine-author';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const currentForgeVersion = require('../package.json').version;

const d = debug('electron-forge:template:base');
const tmplDir = path.resolve(__dirname, '../tmpl');

export class BaseTemplate implements ForgeTemplate {
  public templateDir = tmplDir;

  public requiredForgeVersion = currentForgeVersion;

  get dependencies(): string[] {
    const packageJSONPath = path.join(this.templateDir, 'package.json');
    if (fs.pathExistsSync(packageJSONPath)) {
      const deps = fs.readJsonSync(packageJSONPath).dependencies;
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
    if (fs.pathExistsSync(packageJSONPath)) {
      const packageDevDeps = fs.readJsonSync(packageJSONPath).devDependencies;
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

  public async initializeTemplate(directory: string, { copyCIFiles }: InitTemplateOptions): Promise<ForgeListrTaskDefinition[]> {
    return [
      {
        title: 'Copying starter files',
        task: async () => {
          const pm = await resolvePackageManager();
          d('creating directory:', path.resolve(directory, 'src'));
          await fs.mkdirs(path.resolve(directory, 'src'));
          const rootFiles = ['_gitignore', 'forge.config.js'];

          if (pm.executable === 'pnpm') {
            rootFiles.push('_npmrc');
          }

          if (copyCIFiles) {
            d(`Copying CI files is currently not supported - this will be updated in a later version of Forge`);
          }

          const srcFiles = ['index.css', 'index.js', 'index.html', 'preload.js'];

          for (const file of rootFiles) {
            await this.copy(path.resolve(tmplDir, file), path.resolve(directory, file.replace(/^_/, '.')));
          }
          for (const file of srcFiles) {
            await this.copy(path.resolve(tmplDir, file), path.resolve(directory, 'src', file));
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
    await fs.copy(source, target);
  }

  async copyTemplateFile(destDir: string, basename: string): Promise<void> {
    await this.copy(path.join(this.templateDir, basename), path.resolve(destDir, basename));
  }

  async initializePackageJSON(directory: string): Promise<void> {
    const packageJSON = await fs.readJson(path.resolve(__dirname, '../tmpl/package.json'));
    packageJSON.productName = packageJSON.name = path.basename(directory).toLowerCase();
    packageJSON.author = await determineAuthor(directory);

    const pm = await resolvePackageManager();

    // As of pnpm v10, no postinstall scripts will run unless allowlisted through `onlyBuiltDependencies`
    if (pm.executable === 'pnpm') {
      packageJSON.pnpm = {
        onlyBuiltDependencies: ['electron', 'electron-winstaller'],
      };
    }

    packageJSON.scripts.lint = 'echo "No linting configured"';

    d('writing package.json to:', directory);
    await fs.writeJson(path.resolve(directory, 'package.json'), packageJSON, { spaces: 2 });
  }

  async updateFileByLine(inputPath: string, lineHandler: (line: string) => string, outputPath?: string | undefined): Promise<void> {
    const fileContents = (await fs.readFile(inputPath, 'utf8')).split('\n').map(lineHandler).join('\n');
    await fs.writeFile(outputPath || inputPath, fileContents);
    if (outputPath !== undefined) {
      await fs.remove(inputPath);
    }
  }
}

export default new BaseTemplate();
