import debug from 'debug';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

import asyncOra from '../util/ora-handler';
import confirmIfInteractive from '../util/confirm-if-interactive';

const d = debug('electron-forge:init:directory');

export default async (dir, interactive) => {
  await asyncOra('Initializing Project Directory', async (initSpinner) => {
    d('creating directory:', dir);
    await fs.mkdirs(dir);

    const files = await fs.readdir(dir);
    if (files.length !== 0) {
      d('found', files.length, 'files in the directory.  warning the user');
      initSpinner.stop(logSymbols.warning);
      const confirm = await confirmIfInteractive(interactive, `WARNING: The specified path: "${dir}" is not empty, do you wish to continue?`);
      if (!confirm) {
        throw 'Cancelled by user'; // eslint-disable-line
      }
    }
  });
};
