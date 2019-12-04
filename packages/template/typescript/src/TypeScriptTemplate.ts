import { ForgeTemplate } from '@electron-forge/shared-types';
import { asyncOra } from '@electron-forge/async-ora';

import fs from 'fs-extra';
import path from 'path';

const copyTemplateFile = async (destDir: string, basename: string) => {
  const templateDir = path.resolve(__dirname, '..', 'tmpl');
  await fs.copy(path.join(templateDir, basename), path.resolve(destDir, basename));
};

class TypeScriptTemplate implements ForgeTemplate {
  public devDependencies = [
    'typescript@^3.7.0',
    'tslint@^5.20.0',
  ];

  public initializeTemplate = async (directory: string) => {
    await asyncOra('Setting up Forge configuration', async () => {
      const packageJSONPath = path.resolve(directory, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      // Configure forge plugins for TS template
      packageJSON.config.forge.plugins = packageJSON.config.forge.plugins || [];

      // Configure scripts for TS template
      packageJSON.config.forge.plugins = packageJSON.config.forge.plugins || [];
      packageJSON.scripts.lint = 'tslint -c tslint.json -p tsconfig.json';
      packageJSON.scripts.start = 'tsc && electron-forge start -p dist';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
    });

    await asyncOra('Setting up TypeScript configuration', async () => {
      // Copy tsconfig with a small set of presets
      await copyTemplateFile(directory, 'tsconfig.json');

      // Copy tslint config with recommended settings
      await copyTemplateFile(directory, 'tslint.json');

      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Remove index.js and replace with index.ts
      await fs.remove(filePath('index.js'));
      await copyTemplateFile(path.join(directory, 'src'), 'index.ts.js');
      await fs.rename(filePath('index.ts.js'), filePath('index.ts'));
    });
  }
}

export default new TypeScriptTemplate();
