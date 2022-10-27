import path from 'path';

import { asyncOra } from '@electron-forge/async-ora';
import { InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class TypeScriptWebpackTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  async initializeTemplate(directory: string, options: InitTemplateOptions) {
    await super.initializeTemplate(directory, options);
    await asyncOra('Setting up Forge configuration', async () => {
      await this.copyTemplateFile(directory, 'forge.config.ts');
      await fs.remove(path.resolve(directory, 'forge.config.js'));
    });
    await asyncOra('Setting up TypeScript configuration', async () => {
      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Copy Webpack files
      await this.copyTemplateFile(directory, 'webpack.main.config.js');
      await this.copyTemplateFile(directory, 'webpack.renderer.config.js');
      await this.copyTemplateFile(directory, 'webpack.rules.js');
      await this.copyTemplateFile(directory, 'webpack.plugins.js');

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
    });
  }
}

export default new TypeScriptWebpackTemplate();
