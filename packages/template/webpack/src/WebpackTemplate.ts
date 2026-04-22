import path from 'node:path';

import {
  ForgeListrTaskDefinition,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

const TS_ONLY_DEV_DEPS = new Set([
  'fork-ts-checker-webpack-plugin',
  'ts-loader',
  'typescript',
]);

const TS_ONLY_SCRIPTS = new Set(['typecheck']);

class WebpackTemplate extends BaseTemplate {
  public templateDir = path.resolve(import.meta.dirname, '..', 'tmpl');

  public override get devDependencies(): string[] {
    const all = super.devDependencies;
    if (this._typescript) return all;
    return all.filter((dep) => {
      const name = dep.replace(/@[^@]*$/, '');
      return !TS_ONLY_DEV_DEPS.has(name);
    });
  }

  private _typescript = false;

  public async initializeTemplate(
    directory: string,
    options: InitTemplateOptions,
  ): Promise<ForgeListrTaskDefinition[]> {
    const typescript = options.typescript ?? false;
    this._typescript = typescript;
    const superTasks = await super.initializeTemplate(directory, options);

    return [
      ...superTasks,
      {
        title: 'Setting up Forge configuration',
        task: async () => {
          await fs.remove(path.resolve(directory, 'forge.config.js'));

          if (typescript) {
            await this.copyTemplateFile(directory, 'forge.config.mts');
          } else {
            await this.copyTemplateFile(directory, 'forge.config.mts');
            await this.stripAndRename(
              path.resolve(directory, 'forge.config.mts'),
              path.resolve(directory, 'forge.config.mjs'),
            );
            // For JS, replace module imports with string-based config paths
            // and patch file references from .ts to .js
            await this.updateFileByLine(
              path.resolve(directory, 'forge.config.mjs'),
              (line) => {
                // Remove webpack config imports (JS uses string paths instead)
                if (line.includes("from './webpack.")) return null;
                // Replace object reference with string path
                if (line.includes('mainConfig,'))
                  return line.replace(
                    'mainConfig,',
                    "mainConfig: './webpack.main.config.mjs',",
                  );
                if (/config:\s*rendererConfig,/.test(line))
                  return line.replace(
                    'rendererConfig,',
                    "'./webpack.renderer.config.mjs',",
                  );
                return line
                  .replace(/src\/renderer\.ts/g, 'src/renderer.js')
                  .replace(/src\/preload\.ts/g, 'src/preload.js');
              },
            );
          }
        },
      },
      {
        title: `Setting up ${typescript ? 'TypeScript and webpack' : 'webpack'} configuration`,
        task: async () => {
          if (typescript) {
            // Copy all webpack config files as-is
            await this.copyTemplateFile(directory, 'webpack.main.config.ts');
            await this.copyTemplateFile(
              directory,
              'webpack.renderer.config.ts',
            );
            await this.copyTemplateFile(directory, 'webpack.rules.ts');
            await this.copyTemplateFile(directory, 'webpack.plugins.ts');
            await this.copyTemplateFile(directory, 'tsconfig.json');
          } else {
            for (const name of [
              'webpack.main.config.mjs',
              'webpack.renderer.config.mjs',
              'webpack.rules.mjs',
            ]) {
              await this.copy(
                path.join(this.templateDir, 'js', name),
                path.resolve(directory, name),
              );
            }
          }

          await this.writeLintConfig(directory);

          // Remove base template's JS source files
          await fs.remove(path.resolve(directory, 'src', 'index.js'));
          await fs.remove(path.resolve(directory, 'src', 'preload.js'));

          // Copy and process source files
          if (typescript) {
            await this.copyTemplateFile(path.join(directory, 'src'), 'main.ts');
            await this.copyTemplateFile(
              path.join(directory, 'src'),
              'renderer.ts',
            );
            await this.copyTemplateFile(
              path.join(directory, 'src'),
              'preload.ts',
            );
          } else {
            for (const name of ['main', 'renderer', 'preload']) {
              await this.copyTemplateFile(
                path.join(directory, 'src'),
                `${name}.ts`,
              );
              await this.stripAndRename(
                path.resolve(directory, 'src', `${name}.ts`),
                path.resolve(directory, 'src', `${name}.js`),
              );
            }
          }

          // Remove CSS link from index.html
          await this.updateFileByLine(
            path.resolve(directory, 'src', 'index.html'),
            (line) => {
              if (line.includes('link rel="stylesheet"')) return null;
              return line;
            },
          );

          // Remove TS-only scripts from package.json for JS variant
          if (!typescript) {
            const packageJSONPath = path.resolve(directory, 'package.json');
            const packageJSON = await fs.readJson(packageJSONPath);
            for (const script of TS_ONLY_SCRIPTS) {
              delete packageJSON.scripts[script];
            }
            await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
          }
        },
      },
    ];
  }
}

export default new WebpackTemplate();
