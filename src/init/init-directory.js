import fs from 'fs-promise';
import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import mkdirp from 'mkdirp';
import ora from 'ora';

export default async (dir) => {
  const initSpinner = ora('Initializing Project Directory').start();

  mkdirp.sync(dir);

  const files = await fs.readdir(dir);
  if (files.length !== 0) {
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
