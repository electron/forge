import path from 'node:path';

import { ForgeListrTaskDefinition, InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class WebpackTypeScriptTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  async initializeTemplate(directory: string, options: InitTemplateOptions): Promise<ForgeListrTaskDefinition[]> {
    const superTasks = await super.initializeTemplate(directory, options);
    return [
      ...superTasks,
      {
        title: 'Setting up Forge configuration',
        task: async () => {
          await this.copyTemplateFile(directory, 'forge.config.ts');
          await fs.remove(path.resolve(directory, 'forge.config.js'));
        },
      },
      {
        title: 'Preparing TypeScript files and configuration',
        task: async () => {
          const filePath = (fileName: string) => path.join(directory, 'src', fileName);

          // Copy Webpack files
          await this.copyTemplateFile(directory, 'webpack.main.config.ts');
          await this.copyTemplateFile(directory, 'webpack.renderer.config.ts');
          await this.copyTemplateFile(directory, 'webpack.rules.ts');
          await this.copyTemplateFile(directory, 'webpack.plugins.ts');

          await this.updateFileByLine(path.resolve(directory, 'src', 'index.html'), (line) => {
            if (line.includes('link rel="stylesheet"')) return '';
            return line;
          });

          // Copy tsconfig with a small set of presets
          await this.copyTemplateFile(directory, 'tsconfig.json');

          // Copy eslint config with recommended settings
          await this.copyTemplateFile(directory, '.eslintrc.json');

          // Remove index.js and replace with index.ts
          await fs.remove(filePath('index.js'));
          await this.copyTemplateFile(path.join(directory, 'src'), 'index.ts');

          await this.copyTemplateFile(path.join(directory, 'src'), 'renderer.ts');

          // Remove preload.js and replace with preload.ts
          await fs.remove(filePath('preload.js'));
          await this.copyTemplateFile(path.join(directory, 'src'), 'preload.ts');

          // update package.json
          const packageJSONPath = path.resolve(directory, 'package.json');
          const packageJSON = await fs.readJson(packageJSONPath);
          packageJSON.main = '.webpack/main';
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

export default new WebpackTypeScriptTemplate();
