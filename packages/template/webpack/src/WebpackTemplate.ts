import { ForgeTemplate } from '@electron-forge/shared-types';
import { asyncOra } from '@electron-forge/async-ora';

import fs from 'fs-extra';
import path from 'path';

const currentVersion = require('../package').version;

class WebpackTemplate implements ForgeTemplate {
  public devDependencies = [
    `@electron-forge/plugin-webpack@${currentVersion}`
  ];

  public initializeTemplate = async (directory: string) => {
    await asyncOra('Setting up forge configuration', async () => {
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
      await fs.appendFile(path.resolve(directory, '.gitignore'), '.webpack\n');
      await fs.copy(path.resolve(__dirname, '..', 'tmpl', 'webpack.main.config.js'), path.resolve(directory, 'webpack.main.config.js'));
      await fs.copy(path.resolve(__dirname, '..', 'tmpl', 'webpack.renderer.config.js'), path.resolve(directory, 'webpack.renderer.config.js'));
      await fs.copy(path.resolve(__dirname, '..', 'tmpl', 'webpack.rules.js'), path.resolve(directory, 'webpack.rules.js'));
      await fs.copy(path.resolve(__dirname, '..', 'tmpl', 'renderer.js'), path.resolve(directory, 'src', 'renderer.js'));
      let indexContents = await fs.readFile(path.resolve(directory, 'src', 'index.js'), 'utf8');
      indexContents = indexContents.split('\n').map(line => {
        if (line.includes('mainWindow.loadURL')) return '  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);';
        return line;
      }).join('\n');
      await fs.writeFile(path.resolve(directory, 'src', 'main.js'), indexContents);
      await fs.remove(path.resolve(directory, 'src', 'index.js'));
    });
  }
}

export default new WebpackTemplate();
