import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';

const d = debug('electron-forge:init:directory');

export const initDirectory = async (dir: string, task: ForgeListrTask<any>, force = false): Promise<void> => {
  d('creating directory:', dir);
  await fs.mkdirs(dir);

  const files = await fs.readdir(dir);
  if (files.length !== 0) {
    d(`found ${files.length} files in the directory.  warning the user`);

    if (force) {
      task.output = `${logSymbols.warning} The specified path "${dir}" is not empty. "force" was set to true, so proceeding to initialize. Files may be overwritten`;
    } else {
      throw new Error(`The specified path: "${dir}" is not empty.  Please ensure it is empty before initializing a new project`);
    }
  }
};
