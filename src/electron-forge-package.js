import 'colors';
import asar from 'asar';
import fs from 'fs-promise';
import path from 'path';
import pify from 'pify';
import packager from 'electron-packager';
import program from 'commander';
import ora from 'ora';
import rimraf from 'rimraf';

import './util/terminate';
import getForgeConfig from './util/forge-config';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const packagerSpinner = ora('Packaging Application').start();
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
    packagerSpinner.fail();
    console.error('Failed to locate compilable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));

  const arch = program.arch || process.arch;
  const platform = program.platform || process.platform;

  const forgeConfig = await getForgeConfig(dir);
  const packageOpts = {
    asar: false,
    overwrite: true,
  };
  Object.assign(packageOpts, forgeConfig.electronPackagerConfig);
  Object.assign(packageOpts, {
    afterCopy: [async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await pify(rimraf)(path.resolve(buildPath, 'node_modules/electron-compile/test'));
      done();
    }].concat(forgeConfig.electronPackagerConfig.afterCopy ? forgeConfig.electronPackagerConfig.afterCopy.map(item => require(item)) : []), // eslint-disable-line
    dir,
    arch,
    platform,
    out: path.resolve(dir, 'out'),
    version: packageJSON.devDependencies['electron-prebuilt-compile'],
  });
  console.log(packageOpts);
  const userDefinedAsarPrefs = packageOpts.asar;
  packageOpts.asar = false;
  const log = console.error; // eslint-disable-line
  console.error = () => {}; // eslint-disable-line
  const packageDirs = await pify(packager)(packageOpts);
  console.error = log; // eslint-disable-line

  packagerSpinner.succeed();

  const compileSpinner = ora('Compiling Application').start();

  const compileCLI = require(path.resolve(dir, 'node_modules/electron-compile/lib/cli.js')); // eslint-disable-line
  const { runAsarArchive } = require(path.resolve(dir, 'node_modules/electron-compile/lib/packager-cli.js')); // eslint-disable-line

  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  async function packageDirToResourcesDir(packageDir) {
    const appDir = (await fs.readdir(packageDir)).find(x => x.match(/\.app$/i));
    if (appDir) {
      return path.join(packageDir, appDir, 'Contents', 'Resources', 'app');
    }
    return path.join(packageDir, 'resources', 'app');
  }

  async function compileAndShim(packageDir) {
    const appDir = await packageDirToResourcesDir(packageDir);

    for (const entry of await fs.readdir(appDir)) {
      if (!entry.match(/^(node_modules|bower_components)$/)) {
        const fullPath = path.join(appDir, entry);

        if ((await fs.stat(fullPath)).isDirectory()) {
          await compileCLI.main(appDir, [fullPath]);
        }
      }
    }

    const packageJson = JSON.parse(await fs.readFile(path.join(appDir, 'package.json'), 'utf8'));

    const index = packageJson.main || 'index.js';
    packageJson.originalMain = index;
    packageJson.main = 'es6-shim.js';

    await fs.writeFile(path.join(appDir, 'es6-shim.js'),
      await fs.readFile(path.join(path.resolve(dir, 'node_modules/electron-compile/lib/es6-shim.js')), 'utf8'));

    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify(packageJson, null, 2));
  }

  async function asarMagic(packageDir, asarUnpackDir) {
    const opts = {};
    if (asarUnpackDir) {
      opts.unpackDir = asarUnpackDir;
    }
    const appDir = await packageDirToResourcesDir(packageDir);
    await pify(asar.createPackageWithOptions)(appDir, path.resolve(appDir, '../app.asar'), opts);
    await pify(rimraf)(appDir);
  }

  for (const packageDir of packageDirs) {
    await compileAndShim(packageDir);

    if (userDefinedAsarPrefs) {
      if (typeof userDefinedAsarPrefs === 'object' && userDefinedAsarPrefs.unpack) {
        throw new Error('electron-compile does not support asar.unpack yet.  Please use asar.unpackdir');
      }

      const asarUnpackDir = typeof userDefinedAsarPrefs === 'object' ? userDefinedAsarPrefs.unpackDir || null : null;

      await asarMagic(packageDir, asarUnpackDir);
    }
  }

  process.env.NODE_ENV = env;

  compileSpinner.succeed();
};

if (process.mainModule === module) {
  main();
}

export default main;
