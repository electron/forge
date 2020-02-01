import { asyncOra } from '@electron-forge/async-ora';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';
import { InitTemplateOptions } from '@electron-forge/shared-types';
import path from 'path';

const currentVersion = require('../package').version;

class TypeScriptWebpackTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  public devDependencies = [
    `@electron-forge/plugin-webpack@${currentVersion}`,
    '@marshallofsound/webpack-asset-relocator-loader@^0.5.0',
    'css-loader@^3.0.0',
    'node-loader@^0.6.0',
    'ts-loader@^6.2.1',
    'style-loader@^0.23.1',
    'typescript@^3.7.0',
    'fork-ts-checker-webpack-plugin@^3.1.1',
    'eslint@^6.8.0',
    'eslint-plugin-import@^2.20.0',
    '@typescript-eslint/eslint-plugin@^2.18.0',
    '@typescript-eslint/parser@^2.18.0',
  ];

  async initializeTemplate(directory: string, options: InitTemplateOptions) {
    await super.initializeTemplate(directory, options);
    await asyncOra('Setting up Forge configuration', async () => {
      const packageJSONPath = path.resolve(directory, 'package.json');
      const packageJSON = await fs.readJson(packageJSONPath);

      packageJSON.main = '.webpack/main';
      packageJSON.config.forge.plugins = packageJSON.config.forge.plugins || [];
      packageJSON.config.forge.plugins.push([
        '@electron-forge/plugin-webpack',
        {
          mainConfig: './webpack.main.config.js',
          renderer: {
            config: './webpack.renderer.config.js',
            entryPoints: [{
              html: './src/index.html',
              js: './src/renderer.ts',
              name: 'main_window',
            }],
          },
        },
      ]);

      // Configure scripts for TS template
      packageJSON.scripts.lint = 'eslint --ext .ts .';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
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
    });
  }
}

export default new TypeScriptWebpackTemplate();
