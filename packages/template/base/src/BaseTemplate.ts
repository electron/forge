import path from 'path';

import { ForgeListrTaskDefinition, ForgeTemplate, InitTemplateOptions } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';

import determineAuthor from './determine-author';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const currentForgeVersion = require('../package.json').version;

const d = debug('electron-forge:template:base');
const tmplDir = path.resolve(__dirname, '../tmpl');

export class BaseTemplate implements ForgeTemplate {
  public templateDir = tmplDir;

  public requiredForgeVersion = currentForgeVersion;

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
          d('creating directory:', path.resolve(directory, 'src'));
          await fs.mkdirs(path.resolve(directory, 'src'));
          const rootFiles = ['_gitignore', 'forge.config.js'];
          const ghActionsFiles = ['build.yml', 'README.md'];
          const ciFiles = ['setup-windows-cert.sh', 'codesign.pvk'];
          const codeSignFiles = ['gen-trust.js', 'generate-identity.sh', 'import-testing-cert-ci.sh'];
          if (copyCIFiles) {
            await fs.mkdirs(path.resolve(directory, '.github', 'workflows'));
            await fs.mkdirs(path.resolve(directory, 'ci'));
            await fs.mkdirs(path.resolve(directory, 'ci', 'codesign'));
          }
          const srcFiles = ['index.css', 'index.js', 'index.html', 'preload.js'];

          for (const file of rootFiles) {
            await this.copy(path.resolve(tmplDir, file), path.resolve(directory, file.replace(/^_/, '.')));
          }
          for (const file of srcFiles) {
            await this.copy(path.resolve(tmplDir, file), path.resolve(directory, 'src', file));
          }
  
          if (copyCIFiles) {
            for (const file of ghActionsFiles) {
              await this.copy(path.resolve(tmplDir, '.github', 'workflows', file), path.resolve(directory, '.github', 'workflows', file));
            }
            for (const file of ciFiles) {
              await this.copy(path.resolve(tmplDir, 'ci', file), path.resolve(directory, 'ci', file));
            }
            for (const file of codeSignFiles) {
              await this.copy(path.resolve(tmplDir, 'ci', 'codesign', file), path.resolve(directory, 'ci', 'codesign', file));
            }
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.copy(path.join(this.templateDir!, basename), path.resolve(destDir, basename));
  }

  async initializePackageJSON(directory: string): Promise<void> {
    const packageJSON = await fs.readJson(path.resolve(__dirname, '../tmpl/package.json'));
    packageJSON.productName = packageJSON.name = path.basename(directory).toLowerCase();
    packageJSON.author = await determineAuthor(directory);

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
