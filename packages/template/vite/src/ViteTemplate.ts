import path from 'node:path';

import { moveSync } from '@electron-forge/core-utils';
import {
  ForgeListrTaskDefinition,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';

class ViteTemplate extends BaseTemplate {
  public templateDir = path.resolve(import.meta.dirname, '..', 'tmpl');

  public async initializeTemplate(
    directory: string,
    options: InitTemplateOptions,
  ): Promise<ForgeListrTaskDefinition[]> {
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

          await this.writeLintConfig(directory);
          await this.copyTemplateFile(
            path.join(directory, 'src'),
            'renderer.js',
          );
          await this.copyTemplateFile(
            path.join(directory, 'src'),
            'preload.js',
          );
          await this.copyTemplateFile(path.join(directory, 'src'), 'index.js');

          await this.updateFileByLine(
            path.resolve(directory, 'src', 'index.js'),
            (line) => {
              if (line.includes('and load the index.html of the app'))
                return "  // and load the index.html of the app. In development this is the Vite\n  // dev server URL; in production it is an `app://` URL served by Forge's\n  // Vite plugin.";
              if (line.includes('mainWindow.loadFile'))
                return '  mainWindow.loadURL(MAIN_WINDOW_VITE_ENTRY);';
              return line;
            },
            path.resolve(directory, 'src', 'main.js'),
          );

          // TODO: Compatible with any path entry.
          // Vite uses index.html under the root path as the entry point.
          moveSync(
            path.join(directory, 'src', 'index.html'),
            path.join(directory, 'index.html'),
            { overwrite: options.force },
          );
          await this.updateFileByLine(
            path.join(directory, 'index.html'),
            (line) => {
              if (line.includes('link rel="stylesheet"')) return null;
              if (line.includes('</body>'))
                return '    <script type="module" src="/src/renderer.js"></script>\n  </body>';
              return line;
            },
          );
        },
      },
    ];
  }
}

export default new ViteTemplate();
