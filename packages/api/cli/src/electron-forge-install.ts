import { api, InstallAsset } from '@electron-forge/core';

import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import program from 'commander';
import path from 'path';

import './util/terminate';

(async () => {
  let repo!: string;

  program
    .version((await fs.readJson(path.resolve(__dirname, '../package.json'))).version)
    .arguments('[repository]')
    .option('--prerelease', 'Fetch prerelease versions')
    .action((repository) => {
      repo = repository;
    })
    .parse(process.argv);

  const chooseAsset = async (assets: InstallAsset[]) => {
    const choices: { name: string; value: string }[] = [];
    assets.forEach((asset) => {
      choices.push({ name: asset.name, value: asset.id });
    });
    const { assetID } = await inquirer.createPromptModule()<{ assetID: string }>({
      choices,
      type: 'list',
      name: 'assetID',
      message: chalk.cyan('Multiple potential assets found, please choose one from the list below:'),
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return assets.find((asset) => asset.id === assetID)!;
  };

  await api.install({
    chooseAsset,
    repo,
    interactive: true,
    prerelease: program.prerelease,
  });
})();
