import path from 'path';

import { asyncOra } from '@electron-forge/async-ora';
import { InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class WebpackTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  public async initializeTemplate(directory: string, options: InitTemplateOptions) {
    await super.initializeTemplate(directory, options);
    await asyncOra('Setting up Forge configuration', async () => {
      const forgeConfigPath = path.resolve(directory, 'forge.config.js');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const forgeConfig = require(forgeConfigPath);
      forgeConfig.plugins = forgeConfig.plugins || [];
      forgeConfig.plugins.push({
        name: '@electron-forge/plugin-webpack',
        config: {
          mainConfig: './webpack.main.config.js',
          renderer: {
            config: './webpack.renderer.config.js',
            entryPoints: [
              {
                html: './src/index.html',
                js: './src/renderer.js',
                name: 'main_window',
                preload: {
                  js: './src/preload.js',
                },
              },
            ],
          },
        },
      });
      await fs.writeFile(forgeConfigPath, `module.exports = ${JSON.stringify(forgeConfig, null, 2)}`);
    });
    await asyncOra('Setting up webpack configuration', async () => {
      await this.copyTemplateFile(directory, 'webpack.main.config.js');
      await this.copyTemplateFile(directory, 'webpack.renderer.config.js');
      await this.copyTemplateFile(directory, 'webpack.rules.js');
      await this.copyTemplateFile(path.join(directory, 'src'), 'renderer.js');
      await this.copyTemplateFile(path.join(directory, 'src'), 'preload.js');

      await this.updateFileByLine(
        path.resolve(directory, 'src', 'index.js'),
        (line) => {
          if (line.includes('mainWindow.loadFile')) return '  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);';
          if (line.includes('preload: ')) return '      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,';
          return line;
        },
        path.resolve(directory, 'src', 'main.js')
      );

      await this.updateFileByLine(path.resolve(directory, 'src', 'index.html'), (line) => {
        if (line.includes('link rel="stylesheet"')) return '';
        return line;
      });

      // update package.json entry point
      const pjPath = path.resolve(directory, 'package.json');
      const currentPJ = await fs.readJson(pjPath);
      currentPJ.main = '.webpack/main';
      await fs.writeJson(pjPath, currentPJ, {
        spaces: 2,
      });
    });
  }
}

export default new WebpackTemplate();
