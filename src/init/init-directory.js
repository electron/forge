import debug from 'debug';
import fs from 'fs-promise';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import ora from 'ora';

const d = debug('electron-forge:init:directory');

export default async (dir) => {
  const initSpinner = ora.ora('Initializing Project Directory').start();

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
      initSpinner.fail();
      process.exit(1);
    }
  }
  initSpinner.succeed();
};
