import debug from 'debug';
import fs from 'fs-promise';
import glob from 'glob';
import resolvePackage from 'resolve-package';
import ora from 'ora';
import path from 'path';

import { copy } from './init-starter-files';
import installDepList from '../util/install-dependencies';

const d = debug('electron-forge:init:custom');

export default async (dir, template, lintStyle) => {
  const resolveSpinner = ora.ora(`Locating custom template: "${template}"`).start();
  let templateModulePath;
  try {
    templateModulePath = await resolvePackage(`electron-forge-template-${template}`);
  } catch (err) {
    resolveSpinner.fail();
    throw new Error(`Failed to locate custom template: "${template}"\n\nTry \`npm install -g electron-forge-template-${template}\``);
  }
  resolveSpinner.succeed();

  let templateModule = require(templateModulePath);

  templateModule = templateModule.default || templateModule;

  const installSpinner = ora.ora('Installing Template Dependencies').start();

  try {
    d('installing dependencies');
    await installDepList(dir, templateModule.dependencies || []);
    d('installing devDependencies');
    await installDepList(dir, templateModule.devDependencies || [], true);
  } catch (err) {
    installSpinner.fail();
    throw err;
  }

  installSpinner.succeed();

  const copySpinner = ora.ora('Copying Template Files').start();
  const templateDirectory = templateModule.templateDirectory;
  if (templateDirectory) {
    const tmplPath = templateDirectory;
    if (!path.isAbsolute(templateDirectory)) {
      copySpinner.fail();
      throw new Error(`Custom template path needs to be absolute, this is an issue with "electron-forge-template-${template}"`);
    }

    const files = glob.sync(path.resolve(tmplPath, '**/*'));

    for (const file of files) {
      if ((await fs.stat(file)).isFile()) {
        await copy(file, path.resolve(dir, path.relative(tmplPath, file).replace(/^_/, '.')));
      }
    }
  }

  copySpinner.succeed();

  if (typeof templateModule.postCopy === 'function') {
    await Promise.resolve(templateModule.postCopy(dir, ora.ora, lintStyle));
  }
};
