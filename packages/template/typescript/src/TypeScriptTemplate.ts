import { asyncOra } from '@electron-forge/async-ora';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';
import path from 'path';

class TypeScriptTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  async initializeTemplate(directory: string) {
    await super.initializeTemplate(directory, {});
    await asyncOra('Setting up Forge configuration', async () => {
      const packageJSONPath = path.resolve(directory, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      // Configure scripts for TS template
      packageJSON.scripts.lint = 'eslint --ext .ts .';
      packageJSON.scripts.start = 'tsc && electron-forge start';
      packageJSON.main = 'dist/index.js';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
    });

    await asyncOra('Setting up TypeScript configuration', async () => {
      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Copy tsconfig with a small set of presets
      await this.copyTemplateFile(directory, 'tsconfig.json');

      // Copy eslint config with recommended settings
      await this.copyTemplateFile(directory, '.eslintrc.json');

      // Remove index.js and replace with index.ts
      await fs.remove(filePath('index.js'));
      await this.copyTemplateFile(path.join(directory, 'src'), 'index.ts');

      await this.copyTemplateFile(path.join(directory, 'src'), 'preload.ts');
    });
  }
}

export default new TypeScriptTemplate();
