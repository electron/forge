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

class WebpackTemplate implements ForgeTemplate {
  public devDependencies = [
    `@electron-forge/plugin-webpack@${currentVersion}`,
    // TODO: Use the @zeit publish once https://github.com/zeit/webpack-asset-relocator-loader/pull/41 has been merged
    '@marshallofsound/webpack-asset-relocator-loader@^0.5.0',
    'css-loader@^3.0.0',
    'file-loader@^4.0.0',
    'node-loader@^0.6.0',
    'style-loader@^0.23.1',
  ];

  public initializeTemplate = async (directory: string) => {
    await asyncOra('Setting up Forge configuration', async () => {
      const pjPath = path.resolve(directory, 'package.json');
      const currentPJ = await fs.readJson(pjPath);
      currentPJ.main = '.webpack/main';
      currentPJ.config.forge.plugins = currentPJ.config.forge.plugins || [];
      currentPJ.config.forge.plugins.push([
        '@electron-forge/plugin-webpack',
        {
          mainConfig: './webpack.main.config.js',
          renderer: {
            config: './webpack.renderer.config.js',
            entryPoints: [{
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
            }],
          },
        },
      ]);
      await fs.writeJson(pjPath, currentPJ, {
        spaces: 2,
      });
    });
    await asyncOra('Setting up webpack configuration', async () => {
      await copyTemplateFile(directory, 'webpack.main.config.js');
      await copyTemplateFile(directory, 'webpack.renderer.config.js');
      await copyTemplateFile(directory, 'webpack.rules.js');
      await copyTemplateFile(path.join(directory, 'src'), 'renderer.js');

      await updateFileByLine(path.resolve(directory, 'src', 'index.js'), (line) => {
        if (line.includes('mainWindow.loadURL')) return '  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);';
        return line;
      }, path.resolve(directory, 'src', 'main.js'));

      await updateFileByLine(path.resolve(directory, 'src', 'index.html'), (line) => {
        if (line.includes('link rel="stylesheet"')) return '';
        return line;
      });
    });
  }
}

export default new WebpackTemplate();
