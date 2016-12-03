import 'colors';
import asar from 'asar';
import fs from 'fs-promise';
import path from 'path';
import pify from 'pify';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const packagerSpinner = ora('Packaging Application').start();
  let dir = process.cwd();
  let cutoff = 2;

  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .action((cwd) => {
      if (cwd && fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
        cutoff += 1;
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
    process.exit(1);
  }

  const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));

  const arch = program.arch || process.arch;
  const platform = program.platform || process.platform;

  const packager = require(path.resolve(dir, 'node_modules/electron-packager'));
  const packageOpts = {
    asar: true,
    overwrite: true,
    dir,
    out: path.resolve(dir, 'out'),
    version: packageJSON.devDependencies['electron-prebuilt-compile']
  };
  const userDefinedAsarPrefs = packageOpts.asar;
  packageOpts.asar = false;
  const log = console.error
  console.error = () => {}
  const packageDirs = await pify(packager)(packageOpts);
  console.error = log;

  packagerSpinner.succeed();

  const compileSpinner = ora('Compiling Application').start();

  const { main } = require(path.resolve(dir, 'node_modules/electron-compile/lib/cli.js'));
  const { runAsarArchive } = require(path.resolve(dir, 'node_modules/electron-compile/lib/packager-cli.js'));

  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  async function packageDirToResourcesDir(packageDir) {
    let appDir = (await fs.readdir(packageDir)).find((x) => x.match(/\.app$/i));
    if (appDir) {
      return path.join(packageDir, appDir, 'Contents', 'Resources', 'app');
    } else {
      return path.join(packageDir, 'resources', 'app');
    }
  }

  async function compileAndShim(packageDir) {
    let appDir = await packageDirToResourcesDir(packageDir);

    for (let entry of await fs.readdir(appDir)) {
      if (entry.match(/^(node_modules|bower_components)$/)) continue;

      let fullPath = path.join(appDir, entry);
      let stat = await fs.stat(fullPath);

      if (!stat.isDirectory()) continue;

      await main(appDir, [fullPath]);
    }

    let packageJson = JSON.parse(await fs.readFile(path.join(appDir, 'package.json'), 'utf8'));

    let index = packageJson.main || 'index.js';
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
  }

  for (let packageDir of packageDirs) {
    await compileAndShim(packageDir);

    if (!userDefinedAsarPrefs) continue;
    if (typeof userDefinedAsarPrefs === 'object' && userDefinedAsarPrefs.unpack) {
      throw new Error('electron-compile does not support asar.unpack yet.  Please use asar.unpackdir');
    }

    const asarUnpackDir = typeof userDefinedAsarPrefs === 'object' ? userDefinedAsarPrefs.unpackDir || null : null;

    await asarMagic(packageDir, asarUnpackDir);
  }

  process.env.NODE_ENV = env;

  compileSpinner.succeed();
};

main();
