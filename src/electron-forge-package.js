import 'colors';
import fs from 'fs-promise';
import glob from 'glob';
import path from 'path';
import pify from 'pify';
import packager from 'electron-packager';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import electronHostArch from './util/electron-host-arch';
import getForgeConfig from './util/forge-config';
import packagerCompileHook from './util/compile-hook';
import readPackageJSON from './util/read-package-json';
import rebuildHook from './util/rebuild';
import resolveDir from './util/resolve-dir';

const main = async () => {
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

  const arch = program.arch || electronHostArch();
  const platform = program.platform || process.platform;

  let prepareSpinner = ora.ora(`Preparing to Package Application for arch: ${(arch === 'all' ? 'ia32' : arch).cyan}`).start();
  let prepareCounter = 0;

  dir = await resolveDir(dir);
  if (!dir) {
    prepareSpinner.fail();
    console.error('Failed to locate compilable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const packageJSON = await readPackageJSON(dir);

  const forgeConfig = await getForgeConfig(dir);
  let packagerSpinner;

  const packageOpts = Object.assign({
    asar: false,
    overwrite: true,
  }, forgeConfig.electronPackagerConfig, {
    afterCopy: [async (buildPath, electronVersion, pPlatform, pArch, done) => {
      if (packagerSpinner) {
        packagerSpinner.succeed();
        prepareCounter += 1;
        prepareSpinner = ora.ora(`Preparing to Package Application for arch: ${(prepareCounter === 2 ? 'armv7l' : 'x64').cyan}`).start();
      }
      await fs.remove(path.resolve(buildPath, 'node_modules/electron-compile/test'));
      const bins = await pify(glob)(path.join(buildPath, '**/.bin/**/*'));
      for (const bin of bins) {
        await fs.remove(bin);
      }
      done();
    }, async (...args) => {
      prepareSpinner.succeed();
      await packagerCompileHook(dir, ...args);
    }, async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await rebuildHook(buildPath, electronVersion, pPlatform, pArch);
      packagerSpinner = ora.ora('Packaging Application').start();
      done();
    }].concat(forgeConfig.electronPackagerConfig.afterCopy ? forgeConfig.electronPackagerConfig.afterCopy.map(item =>
      (typeof item === 'string' ? require(item) : item)
    ) : []),
    afterExtract: forgeConfig.electronPackagerConfig.afterExtract ? forgeConfig.electronPackagerConfig.afterExtract.map(item =>
      (typeof item === 'string' ? require(item) : item)
    ) : [],
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
