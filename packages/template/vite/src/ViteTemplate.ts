import fs from 'node:fs/promises';
import path from 'node:path';

import { move, readJson, writeJson } from '@electron-forge/core-utils';
import {
  ForgeListrTaskDefinition,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';

const TS_ONLY_DEV_DEPS = new Set([
  '@types/electron-squirrel-startup',
  'typescript',
]);

const TS_ONLY_SCRIPTS = new Set(['typecheck']);

class ViteTemplate extends BaseTemplate {
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
          // Remove the base template's forge.config.js
          await fs.rm(path.resolve(directory, 'forge.config.js'), {
            force: true,
          });

          if (typescript) {
            await this.copyTemplateFile(directory, 'forge.config.mts');
          } else {
            await this.copyTemplateFile(directory, 'forge.config.mts');
            const forgeConfigPath = path.resolve(directory, 'forge.config.mjs');
            await this.stripAndRename(
              path.resolve(directory, 'forge.config.mts'),
              forgeConfigPath,
            );
            // Patch entry/config paths from .ts to .js/.mjs
            await this.updateFileByLine(forgeConfigPath, (line) =>
              line
                .replace(/src\/main\.ts/g, 'src/main.js')
                .replace(/src\/preload\.ts/g, 'src/preload.js')
                .replace(/vite\.main\.config\.ts/g, 'vite.main.config.mjs')
                .replace(
                  /vite\.preload\.config\.ts/g,
                  'vite.preload.config.mjs',
                )
                .replace(
                  /vite\.renderer\.config\.ts/g,
                  'vite.renderer.config.mjs',
                ),
            );
          }
        },
      },
      {
        title: `Setting up ${typescript ? 'TypeScript and Vite' : 'Vite'} configuration`,
        task: async () => {
          // Copy Vite config files
          if (typescript) {
            await this.copyTemplateFile(directory, 'vite.main.config.ts');
            await this.copyTemplateFile(directory, 'vite.preload.config.ts');
            await this.copyTemplateFile(directory, 'vite.renderer.config.ts');
          } else {
            for (const name of [
              'vite.main.config',
              'vite.preload.config',
              'vite.renderer.config',
            ]) {
              await this.copyTemplateFile(directory, `${name}.ts`);
              await this.stripAndRename(
                path.resolve(directory, `${name}.ts`),
                path.resolve(directory, `${name}.mjs`),
              );
            }
          }

          // Copy tsconfig for TypeScript only
          if (typescript) {
            await this.copyTemplateFile(directory, 'tsconfig.json');
          }

          await this.writeLintConfig(directory);

          // Remove base template's JS source files
          await fs.rm(path.resolve(directory, 'src', 'index.js'), {
            force: true,
          });
          await fs.rm(path.resolve(directory, 'src', 'preload.js'), {
            force: true,
          });

          // Copy source files
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
            // Copy TS source files, strip types, rename to .js
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

          const ext = typescript ? 'ts' : 'js';

          await move(
            path.join(directory, 'src', 'index.html'),
            path.join(directory, 'index.html'),
            { overwrite: options.force },
          );
          await this.updateFileByLine(
            path.join(directory, 'index.html'),
            (line) => {
              if (line.includes('link rel="stylesheet"')) return null;
              if (line.includes('</body>'))
                return `    <script type="module" src="/src/renderer.${ext}"></script>\n  </body>`;
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

export default new ViteTemplate();
