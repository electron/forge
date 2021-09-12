import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

const d = debug('electron-forge:init:directory');

export default async (dir: string, force = false): Promise<void> => {
  await asyncOra('Initializing Project Directory', async (initSpinner) => {
    d('creating directory:', dir);
    await fs.mkdirs(dir);

    const files = await fs.readdir(dir);
    if (files.length !== 0) {
      d(`found ${files.length} files in the directory.  warning the user`);

      if (force) {
        initSpinner.warn(`The specified path "${dir}" is not empty. "force" was set to true, so proceeding to initialize. Files may be overwritten`);
      } else {
        initSpinner.stop(logSymbols.warning);
        throw new Error(`The specified path: "${dir}" is not empty.  Please ensure it is empty before initializing a new project`);
      }
    }
  });
};
