import fs from 'node:fs/promises';
import path from 'node:path';

import { readJson, writeJson } from '@electron-forge/core-utils';
import {
  ForgeListrTaskDefinition,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';

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
          await fs.rm(path.resolve(directory, 'forge.config.js'), {
            force: true,
          });

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
            const forgeConfigPath = path.resolve(directory, 'forge.config.mjs');
            await this.updateFileByLine(forgeConfigPath, (line) => {
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
            });
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
            // JS webpack configs are hand-maintained in tmpl/js/ because
            // they differ structurally from the TS variants (no ts-loader,
            // no fork-ts-checker-webpack-plugin, different rule sets).
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
          await fs.rm(path.resolve(directory, 'src', 'index.js'), {
            force: true,
          });
          await fs.rm(path.resolve(directory, 'src', 'preload.js'), {
            force: true,
          });

          // Copy and process source files
          if (typescript) {
            await this.copyTemplateFile(
              path.join(directory, 'src'),
              'declarations.d.ts',
            );
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
            const packageJSON = await readJson(packageJSONPath);
            for (const script of TS_ONLY_SCRIPTS) {
              delete packageJSON.scripts[script];
            }
            await writeJson(packageJSONPath, packageJSON, { spaces: 2 });
          }
        },
      },
    ];
  }
}

export default new WebpackTemplate();
