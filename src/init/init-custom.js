import debug from 'debug';
import fs from 'fs-promise';
import glob from 'glob';
import resolvePackage from 'resolve-package';
import ora from 'ora';
import path from 'path';

import { copy } from './init-starter-files';
import asyncOra from '../util/ora-handler';
import installDepList from '../util/install-dependencies';

const d = debug('electron-forge:init:custom');

export default async (dir, template, lintStyle) => {
  let templateModulePath;
  await asyncOra(`Locating custom template: "${template}"`, async () => {
    try {
      templateModulePath = await resolvePackage(`electron-forge-template-${template}`);
    } catch (err) {
      // eslint-disable-next-line no-throw-literal
      throw `Failed to locate custom template: "${template}"\n\nTry \`npm install -g electron-forge-template-${template}\``;
    }
  });

  let templateModule = require(templateModulePath);

  templateModule = templateModule.default || templateModule;

  await asyncOra('Installing Template Dependencies', async () => {
    d('installing dependencies');
    await installDepList(dir, templateModule.dependencies || []);
    d('installing devDependencies');
    await installDepList(dir, templateModule.devDependencies || [], true);
  });

  await asyncOra('Copying Template Files', async () => {
    const templateDirectory = templateModule.templateDirectory;
    if (templateDirectory) {
      const tmplPath = templateDirectory;
      if (!path.isAbsolute(templateDirectory)) {
        // eslint-disable-next-line no-throw-literal
        throw `Custom template path needs to be absolute, this is an issue with "electron-forge-template-${template}"`;
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
    await Promise.resolve(templateModule.postCopy(dir, ora.ora, lintStyle));
  }
};
