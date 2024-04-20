import path from 'path';

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
          await this.copyTemplateFile(directory, 'forge.config.cjs');
          await this.copyTemplateFile(directory, 'forge.env.d.txt');
          await fs.remove(path.resolve(directory, 'forge.config.js'));
          await fs.rename(path.join(directory, 'forge.env.d.txt'), path.join(directory, 'forge.env.d.ts'));
        },
      },
      {
        title: 'Setting up Vite configuration',
        task: async () => {
          await this.copyTemplateFile(directory, 'vite.base.config.js');
          await this.copyTemplateFile(directory, 'vite.main.config.js');
          await this.copyTemplateFile(directory, 'vite.preload.config.js');
          await this.copyTemplateFile(directory, 'vite.renderer.config.js');
          await this.copyTemplateFile(path.join(directory, 'src'), 'main.js');
          await this.copyTemplateFile(path.join(directory, 'src'), 'renderer.js');
          await this.copyTemplateFile(path.join(directory, 'src'), 'preload.js');

          await fs.remove(path.join(directory, 'src', 'index.js'));

          // TODO: Compatible with any path entry.
          // Vite uses index.html under the root path as the entry point.
          fs.moveSync(path.join(directory, 'src', 'index.html'), path.join(directory, 'index.html'));
          await this.updateFileByLine(path.join(directory, 'index.html'), (line) => {
            if (line.includes('link rel="stylesheet"')) return '';
            if (line.includes('</body>')) return '    <script type="module" src="/src/renderer.js"></script>\n  </body>';
            return line;
          });

          // Update package.json entry point
          const pjPath = path.resolve(directory, 'package.json');
          const currentPJ = await fs.readJson(pjPath);
          currentPJ.main = '.vite/build/main.js';
          // ESModule
          currentPJ.type = 'module';
          await fs.writeJson(pjPath, currentPJ, {
            spaces: 2,
          });
        },
      },
    ];
  }
}

export default new ViteTemplate();
