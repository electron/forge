import { asyncOra } from '@electron-forge/async-ora';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';
import path from 'path';

class TypeScriptTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  public devDependencies = [
    'typescript@^3.7.0',
    'tslint@^5.20.0',
  ];

  async initializeTemplate(directory: string) {
    await super.initializeTemplate(directory, {});
    await asyncOra('Setting up Forge configuration', async () => {
      const packageJSONPath = path.resolve(directory, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      // Configure scripts for TS template
      packageJSON.scripts.lint = 'tslint -c tslint.json -p tsconfig.json';
      packageJSON.scripts.start = 'tsc && electron-forge start -p dist';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
    });

    await asyncOra('Setting up TypeScript configuration', async () => {
      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Copy tsconfig with a small set of presets
      await this.copyTemplateFile(directory, 'tsconfig.json');

      // Copy tslint config with recommended settings
      await this.copyTemplateFile(directory, 'tslint.json');

      // Remove index.js and replace with index.ts
      await fs.remove(filePath('index.js'));
      await this.copyTemplateFile(path.join(directory, 'src'), 'index.ts');
    });
  }
}

export default new TypeScriptTemplate();
