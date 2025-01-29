import path from 'node:path';

import { ForgeListrTaskDefinition, InitTemplateOptions } from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class ViteTemplate extends BaseTemplate {
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
        title: 'Setting up Vite configuration',
        task: async () => {
          await this.copyTemplateFile(directory, 'vite.main.config.mjs');
          await this.copyTemplateFile(directory, 'vite.preload.config.mjs');
          await this.copyTemplateFile(directory, 'vite.renderer.config.mjs');
          await this.copyTemplateFile(path.join(directory, 'src'), 'renderer.js');
          await this.copyTemplateFile(path.join(directory, 'src'), 'preload.js');
          await this.copyTemplateFile(path.join(directory, 'src'), 'index.js');

          await this.updateFileByLine(
            path.resolve(directory, 'src', 'index.js'),
            (line) => {
              if (line.includes('mainWindow.loadFile'))
                return `  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, \`../renderer/\${MAIN_WINDOW_VITE_NAME}/index.html\`));
  }`;
              return line;
            },
            path.resolve(directory, 'src', 'main.js')
          );

          // TODO: Compatible with any path entry.
          // Vite uses index.html under the root path as the entry point.
          fs.moveSync(path.join(directory, 'src', 'index.html'), path.join(directory, 'index.html'), { overwrite: options.force });
          await this.updateFileByLine(path.join(directory, 'index.html'), (line) => {
            if (line.includes('link rel="stylesheet"')) return '';
            if (line.includes('</body>')) return '    <script type="module" src="/src/renderer.js"></script>\n  </body>';
            return line;
          });

          // update package.json entry point
          const pjPath = path.resolve(directory, 'package.json');
          const currentPJ = await fs.readJson(pjPath);
          currentPJ.main = '.vite/build/main.js';
          await fs.writeJson(pjPath, currentPJ, {
            spaces: 2,
          });
        },
      },
    ];
  }
}

export default new ViteTemplate();
