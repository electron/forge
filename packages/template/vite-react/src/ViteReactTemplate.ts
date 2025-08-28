import path from 'node:path';

import {
  ForgeListrTaskDefinition,
  InitTemplateOptions,
} from '@electron-forge/shared-types';
import { BaseTemplate } from '@electron-forge/template-base';
import fs from 'fs-extra';

class ViteReactTemplate extends BaseTemplate {
  public templateDir = path.resolve(__dirname, '..', 'tmpl');

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
          const filePath = (fileName: string) =>
            path.join(directory, 'src', fileName);

          await this.copyTemplateFile(directory, 'vite.main.config.mjs');
          await this.copyTemplateFile(directory, 'vite.preload.config.mjs');
          await this.copyTemplateFile(directory, 'vite.renderer.config.mjs');
          await this.copyTemplateFile(
            path.join(directory, 'src'),
            'renderer.jsx',
          );
          await this.copyTemplateFile(
            path.join(directory, 'src'),
            'preload.js',
          );

          // Remove index.js and replace with main.ts
          await fs.remove(filePath('index.js'));
          await this.copyTemplateFile(path.join(directory, 'src'), 'main.js');

          await this.copyTemplateFile(path.join(directory, 'src'), 'index.jsx');

          // TODO: Compatible with any path entry.
          // Vite uses index.html under the root path as the entry point.
          fs.moveSync(
            path.join(directory, 'src', 'index.html'),
            path.join(directory, 'index.html'),
            { overwrite: options.force },
          );
          await this.updateFileByLine(
            path.join(directory, 'index.html'),
            (line) => {
              if (line.includes('link rel="stylesheet"')) return '';
              if (line.includes('</body>'))
                return '    <script type="module" src="/src/renderer.jsx"></script>\n  </body>';
              return line;
            },
          );

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

export default new ViteReactTemplate();
