import path from 'node:path';

import { ForgeListrTaskDefinition, InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class ViteTypeScriptTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  public async initializeTemplate(directory: string, options: InitTemplateOptions): Promise<ForgeListrTaskDefinition[]> {
    const superTasks = await super.initializeTemplate(directory, options);
    return [
      ...superTasks,
      {
        title: 'Setting up Forge configuration',
        task: async () => {
          await this.copyTemplateFile(directory, 'forge.env.d.ts');
          await this.copyTemplateFile(directory, 'forge.config.ts');
          await fs.remove(path.resolve(directory, 'forge.config.js'));
        },
      },
      {
        title: 'Preparing TypeScript files and configuration',
        task: async () => {
          const filePath = (fileName: string) => path.join(directory, 'src', fileName);

          // Copy Vite files
          await this.copyTemplateFile(directory, 'vite.main.config.ts');
          await this.copyTemplateFile(directory, 'vite.preload.config.ts');
          await this.copyTemplateFile(directory, 'vite.renderer.config.ts');

          // Copy tsconfig with a small set of presets
          await this.copyTemplateFile(directory, 'tsconfig.json');

          // Copy eslint config with recommended settings
          await this.copyTemplateFile(directory, '.eslintrc.json');

          // Remove index.js and replace with main.ts
          await fs.remove(filePath('index.js'));
          await this.copyTemplateFile(path.join(directory, 'src'), 'main.ts');

          await this.copyTemplateFile(path.join(directory, 'src'), 'renderer.ts');

          // Remove preload.js and replace with preload.ts
          await fs.remove(filePath('preload.js'));
          await this.copyTemplateFile(path.join(directory, 'src'), 'preload.ts');

          // TODO: Compatible with any path entry.
          // Vite uses index.html under the root path as the entry point.
          await fs.move(filePath('index.html'), path.join(directory, 'index.html'), { overwrite: options.force });
          await this.updateFileByLine(path.join(directory, 'index.html'), (line) => {
            if (line.includes('link rel="stylesheet"')) return '';
            if (line.includes('</body>')) return '    <script type="module" src="/src/renderer.ts"></script>\n  </body>';
            return line;
          });

          // update package.json
          const packageJSONPath = path.resolve(directory, 'package.json');
          const packageJSON = await fs.readJson(packageJSONPath);
          packageJSON.main = '.vite/build/main.js';
          // Configure scripts for TS template
          packageJSON.scripts.lint = 'eslint --ext .ts,.tsx .';
          await fs.writeJson(packageJSONPath, packageJSON, {
            spaces: 2,
          });
        },
      },
    ];
  }
}

export default new ViteTypeScriptTemplate();
