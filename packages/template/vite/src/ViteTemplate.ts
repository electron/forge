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
          await fs.remove(path.resolve(directory, 'forge.config.js'));
          await this.copyTemplateFile(directory, 'forge.config.js');
        },
      },
      {
        title: 'Setting up electron-vite configuration',
        task: async () => {
          const filePath = (fileName: string) => path.join(directory, 'src', fileName);

          // Copy electron-vite config file
          await this.copyTemplateFile(directory, 'electron.vite.config.js');

          //remove index.js and replace with main/index.js
          await fs.remove(filePath('index.js'));
          await this.copyTemplateFile(path.join(directory, 'src', 'main'), 'index.js');

          // move preload.js to preload/index.js
          await fs.move(filePath('preload.js'), path.join(directory, 'src', 'preload', 'index.js'));

          //remove index.html and replace with renderer/index.html
          await fs.remove(filePath('index.html'));
          await this.copyTemplateFile(path.join(directory, 'src', 'renderer'), 'index.html');
          await fs.move(filePath('index.css'), path.join(directory, 'src', 'renderer', 'index.css'));
          await this.copyTemplateFile(path.join(directory, 'src', 'renderer'), 'renderer.js');

          // update package.json entry point
          const pjPath = path.resolve(directory, 'package.json');
          const currentPJ = await fs.readJson(pjPath);

          const electron_vite_out = '.electron-vite';

          currentPJ.main = `${electron_vite_out}/main`;

          // Configure scripts
          const outFlag = `--outDir=${electron_vite_out}`;
          currentPJ.scripts.start = `electron-vite dev ${outFlag}`;
          currentPJ.scripts.prebuild = `electron-vite build ${outFlag}`;
          currentPJ.scripts.preview = `electron-vite preview ${outFlag}`;
          currentPJ.scripts.package = 'npm run prebuild && electron-forge package';
          currentPJ.scripts.make = 'npm run prebuild && electron-forge make';
          await fs.writeJson(pjPath, currentPJ, {
            spaces: 2,
          });
        },
      },
    ];
  }
}

export default new ViteTemplate();
