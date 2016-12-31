import debug from 'debug';
import fs from 'fs-promise';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:directory');

export default async (dir) => {
  await asyncOra('Initializing Project Directory', async (initSpinner) => {
    d('creating directory:', dir);
    await fs.mkdirs(dir);

    const files = await fs.readdir(dir);
    if (files.length !== 0) {
      d('found', files.length, 'files in the directory.  warning the user');
      initSpinner.stop(logSymbols.warning);
      const { confirm } = await inquirer.createPromptModule()({
        type: 'confirm',
        name: 'confirm',
        message: `WARNING: The specified path: "${dir}" is not empty, do you wish to continue?`,
      });
      if (!confirm) {
        throw 'Cancelled by user'; // eslint-disable-line
      }
    }
  });
};
