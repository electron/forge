import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import resolvePackage from 'resolve-package';

import { ForgeTemplate } from '@electron-forge/shared-types';
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

  if (typeof templateModule.initializeTemplate === 'function') {
    await Promise.resolve(templateModule.initializeTemplate(dir));
  }
};
