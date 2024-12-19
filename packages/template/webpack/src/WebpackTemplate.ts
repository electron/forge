import path from 'node:path';

import { ForgeListrTaskDefinition, InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class WebpackTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

  public async initializeTemplate(directory: string, options: InitTemplateOptions): Promise<ForgeListrTaskDefinition[]> {
    const superTasks = await super.initializeTemplate(directory, options);
    return [
      ...superTasks,
      {
        title: 'Setting up Forge configuration',
        task: async () => {
          await this.copyTemplateFile(directory, 'forge.config.js');
        },
      },
      {
        title: 'Setting up webpack configuration',
        task: async () => {
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
        },
      },
    ];
  }
}

export default new WebpackTemplate();
