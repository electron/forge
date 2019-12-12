import { ForgeTemplate } from '@electron-forge/shared-types';
import { asyncOra } from '@electron-forge/async-ora';

import fs from 'fs-extra';
import path from 'path';

const currentVersion = require('../package').version;

const copyTemplateFile = async (destDir: string, basename: string) => {
  const templateDir = path.resolve(__dirname, '..', 'tmpl');
  await fs.copy(path.join(templateDir, basename), path.resolve(destDir, basename));
};

const updateFileByLine = async (
  inputPath: string,
  lineHandler: (line: string) => string,
  outputPath: string | undefined = undefined,
) => {
  const fileContents = (await fs.readFile(inputPath, 'utf8')).split('\n').map(lineHandler).join('\n');
  await fs.writeFile(outputPath || inputPath, fileContents);
  if (outputPath !== undefined) {
    await fs.remove(inputPath);
  }
};

class TypeScriptWebpackTemplate implements ForgeTemplate {
  public devDependencies = [
    `@electron-forge/plugin-webpack@${currentVersion}`,
    '@marshallofsound/webpack-asset-relocator-loader@^0.5.0',
    'css-loader@^3.0.0',
    'node-loader@^0.6.0',
    'ts-loader@^6.2.1',
    'style-loader@^0.23.1',
    'typescript@^3.7.0',
    'tslint@^5.20.0',
    'fork-ts-checker-webpack-plugin@^3.1.1',
  ];

  public initializeTemplate = async (directory: string) => {
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
      packageJSON.scripts.lint = 'tslint -c tslint.json -p tsconfig.json';

      await fs.writeJson(packageJSONPath, packageJSON, { spaces: 2 });
    });

    await asyncOra('Setting up TypeScript configuration', async () => {
      const filePath = (fileName: string) => path.join(directory, 'src', fileName);

      // Copy Webpack files
      await copyTemplateFile(directory, 'webpack.main.config.js');
      await copyTemplateFile(directory, 'webpack.renderer.config.js');
      await copyTemplateFile(directory, 'webpack.rules.js');
      await copyTemplateFile(directory, 'webpack.plugins.js');

      await updateFileByLine(path.resolve(directory, 'src', 'index.html'), (line) => {
        if (line.includes('link rel="stylesheet"')) return '';
        return line;
      });

      // Copy tsconfig with a small set of presets
      await copyTemplateFile(directory, 'tsconfig.json');

      // Copy tslint config with recommended settings
      await copyTemplateFile(directory, 'tslint.json');

      // Remove index.js and replace with index.ts
      await fs.remove(filePath('index.js'));
      await copyTemplateFile(path.join(directory, 'src'), 'index.ts');

      await copyTemplateFile(path.join(directory, 'src'), 'renderer.ts');
    });
  }
}

export default new TypeScriptWebpackTemplate();
