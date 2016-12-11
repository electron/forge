import 'colors';
import fs from 'fs-promise';
import path from 'path';
import pify from 'pify';
import packager from 'electron-packager';
import program from 'commander';
import ora from 'ora';
import rimraf from 'rimraf';

import './util/terminate';
import getForgeConfig from './util/forge-config';
import packagerCompileHook from './util/compile-hook';
import rebuildHook from './util/rebuild';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const prepareSpinner = ora.ora('Preparing to Package Application').start();
  let dir = process.cwd();

  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .on('--help', () => {
      console.log('NOTE: All `electron-packager` arguments will be passed through to the packager');
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    prepareSpinner.fail();
    console.error('Failed to locate compilable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));

  const arch = program.arch || process.arch;
  const platform = program.platform || process.platform;

  const forgeConfig = await getForgeConfig(dir);
  let packagerSpinner;

  const packageOpts = Object.assign({
    asar: false,
    overwrite: true,
  }, forgeConfig.electronPackagerConfig, {
    afterCopy: [async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await pify(rimraf)(path.resolve(buildPath, 'node_modules/electron-compile/test'));
      done();
    }, async (...args) => {
      prepareSpinner.succeed();
      await packagerCompileHook(dir, ...args);
    }, async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await rebuildHook(buildPath, electronVersion, pPlatform, pArch);
      packagerSpinner = ora.ora('Packaging Application').start();
      done();
    }].concat(forgeConfig.electronPackagerConfig.afterCopy ? forgeConfig.electronPackagerConfig.afterCopy.map(item => require(item)) : []),
    afterExtract: forgeConfig.electronPackagerConfig.afterExtract ? forgeConfig.electronPackagerConfig.afterExtract.map(item => require(item)) : [],
    dir,
    arch,
    platform,
    out: path.resolve(dir, 'out'),
    version: packageJSON.devDependencies['electron-prebuilt-compile'],
  });
  packageOpts.quiet = true;
  if (typeof packageOpts.asar === 'object' && packageOpts.unpack) {
    packagerSpinner.fail();
    throw new Error('electron-compile does not support asar.unpack yet.  Please use asar.unpackDir');
  }

  await pify(packager)(packageOpts);

  packagerSpinner.succeed();
};

if (process.mainModule === module) {
  main();
}

export default main;
