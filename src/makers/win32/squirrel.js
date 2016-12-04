import { createWindowsInstaller } from 'electron-winstaller';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import path from 'path';
import pify from 'pify';
import rimraf from 'rimraf';

export default async (dir, appName, forgeConfig) => {
  const outPath = path.resolve(dir, '../make/squirrel.windows');
  if (await fs.exists(outPath)) {
    await pify(rimraf)(outPath);
  }
  await pify(mkdirp)(outPath);
  const winstallerConfig = Object.assign({
    description: 'This is the default electron-forge description, you can override it in your config',
  }, forgeConfig.electronWinstallerConfig, {
    appDirectory: dir,
    outputDirectory: outPath,
  });
  await createWindowsInstaller(winstallerConfig);
};
