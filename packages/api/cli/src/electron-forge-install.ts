import { api, InstallAsset } from '@electron-forge/core';
import inquirer from 'inquirer';

import program from 'commander';

import './util/terminate';

(async () => {
  let repo!: string;

  program
    .version(require('../package.json').version)
    .arguments('[repository]')
    .option('--prerelease', 'Fetch prerelease versions')
    .action((repository) => {
      repo = repository;
    })
    .parse(process.argv);
  
  const chooseAsset = async (assets: InstallAsset[]) => {
    const choices: { name: string, value: string }[] = [];
    assets.forEach((asset) => {
      choices.push({ name: asset.name, value: asset.id });
    });
    const { assetID } = await inquirer.createPromptModule()<{ assetID: string }>({
      type: 'list',
      name: 'assetID',
      message: 'Multiple potential assets found, please choose one from the list below:'.cyan,
      choices,
    });

    return assets.find(asset => asset.id === assetID)!;
  }

  await api.install({
    repo,
    interactive: true,
    chooseAsset,
    prerelease: program.prerelease,
  });
})();
