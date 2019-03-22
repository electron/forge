import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import glob from 'glob';
import resolvePackage from 'resolve-package';
import path from 'path';

import { ForgeTemplate } from '@electron-forge/shared-types';
import { copy } from './init-starter-files';
import installDepList, { DepType } from '../../util/install-dependencies';
// https://github.com/benmosher/eslint-plugin-import/issues/1120
// eslint-disable-next-line import/named
import { PossibleModule } from '../../util/require-search';

const d = debug('electron-forge:init:custom');

export default async (dir: string, template: string) => {
  let templateModulePath!: string;
  await asyncOra(`Locating custom template: "${template}"`, async () => {
    try {
      templateModulePath = await resolvePackage(`electron-forge-template-${template}`);
      d('using global template');
    } catch (err) {
      try {
        templateModulePath = await resolvePackage(`@electron-forge/template-${template}`);
        d('using global template');
      } catch (err2) {
        try {
          templateModulePath = require.resolve(`electron-forge-template-${template}`);
          d('using local template');
        } catch (err3) {
          try {
            templateModulePath = require.resolve(`@electron-forge/template-${template}`);
            d('using local template');
          } catch (err4) {
            try {
              templateModulePath = require.resolve(template);
              d('using absolute template');
            } catch (err5) {
              throw new Error(`Failed to locate custom template: "${template}"\n\nTry \`npm install -g @electron-forge-template-${template}\``);
            }
          }
        }
      }
    }
  });

  // eslint-disable-next-line import/no-dynamic-require, global-require
  let templateModule: PossibleModule<ForgeTemplate> = require(templateModulePath);

  templateModule = templateModule.default || templateModule;

  await asyncOra('Installing Template Dependencies', async () => {
    d('installing dependencies');
    await installDepList(dir, templateModule.dependencies || []);
    d('installing devDependencies');
    await installDepList(dir, templateModule.devDependencies || [], DepType.DEV);
  });

  await asyncOra('Copying Template Files', async () => {
    const { templateDirectory } = templateModule;
    if (templateDirectory) {
      const tmplPath = templateDirectory;
      if (!path.isAbsolute(templateDirectory)) {
        throw new Error(`Custom template path needs to be absolute, this is an issue with "electron-forge-template-${template}"`);
      }

      const files = glob.sync(path.resolve(tmplPath, '**/*'));

      for (const file of files) {
        if ((await fs.stat(file)).isFile()) {
          await copy(file, path.resolve(dir, path.relative(tmplPath, file).replace(/^_/, '.')));
        }
      }
    }
  });

  if (typeof templateModule.postCopy === 'function') {
    await Promise.resolve(templateModule.postCopy(dir));
  }
};
