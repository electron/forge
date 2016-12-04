import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import getForgeConfig from './util/forge-config';
import packager from './electron-forge-package';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const resolveSpinner = ora.ora('Resolving Forge Config').start();
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-s, --skip-package', 'Assume the app is already packaged')
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    resolveSpinner.fail();
    console.error('Failed to locate makeable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  resolveSpinner.succeed();

  if (!program.skipPackage) {
    console.info('We need to package your application before we can make it'.green);
    await packager();
  } else {
    console.warn('WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  const forgeConfig = await getForgeConfig(dir);
  const targets = forgeConfig.make_targets[process.platform];

  console.info('Making for the following targets:', `${targets.join(', ')}`.cyan);

  const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));
  const packageDir = path.resolve(dir, `out/${packageJSON.productName || packageJSON.name}-${process.platform}-${process.arch}`);
  if (!(await fs.exists(packageDir))) {
    throw new Error(`Couldn't find packaged app at: ${packageDir}`);
  }

  for (const target of targets) {
    const makeSpinner = ora.ora(`Making for target: ${target.cyan} - On platform: ${process.platform.cyan}`).start();
    let maker;
    try {
      maker = require(`./makers/${process.platform}/${target}.js`);
    } catch (err1) {
      try {
        maker = require(`./makers/generic/${target}.js`);
      } catch (err2) {
        makeSpinner.fail();
        throw new Error(`Could not find a build target with the name: ${target} for the platform: ${process.platform}`);
      }
    }
    try {
      await (maker.default || maker)(packageDir, packageJSON.productName || packageJSON.name, forgeConfig, packageJSON);
    } catch (err) {
      makeSpinner.fail();
      if (err) throw err;
      throw new Error(`An error occurred while making for target: ${target}`);
    }
    makeSpinner.succeed();
  }
};

main();
