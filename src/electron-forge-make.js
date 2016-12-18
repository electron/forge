import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import electronHostArch from './util/electron-host-arch';
import getForgeConfig from './util/forge-config';
import packager from './electron-forge-package';
import readPackageJSON from './util/read-package-json';
import resolveDir from './util/resolve-dir';

const main = async () => {
  const resolveSpinner = ora.ora('Resolving Forge Config').start();
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('-s, --skip-package', 'Assume the app is already packaged')
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
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    resolveSpinner.fail();
    console.error('Failed to locate makeable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  resolveSpinner.succeed();

  if (program.platform && program.platform !== process.platform && !(process.platform === 'darwin' && program.platform === 'mas')) {
    console.error('You can not "make" for a platform other than your systems platform'.red);
    process.exit(1);
  }

  if (!program.skipPackage) {
    console.info('We need to package your application before we can make it'.green);
    await packager();
  } else {
    console.warn('WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  const declaredArch = program.arch || electronHostArch();
  const declaredPlatform = program.platform || process.platform;

  const forgeConfig = await getForgeConfig(dir);
  const targets = forgeConfig.make_targets[declaredPlatform];

  console.info('Making for the following targets:', `${targets.join(', ')}`.cyan);

  let targetArchs = [declaredArch];
  if (declaredArch === 'all') {
    switch (process.platform) {
      case 'darwin':
        targetArchs = ['x64'];
        break;
      case 'linux':
        targetArchs = ['ia32', 'x64', 'armv7l'];
        break;
      case 'win32':
      default:
        targetArchs = ['ia32', 'x64'];
        break;
    }
  }

  const packageJSON = await readPackageJSON(dir);
  const appName = packageJSON.productName || packageJSON.name;

  for (const targetArch of targetArchs) {
    const packageDir = path.resolve(dir, `out/${appName}-${declaredPlatform}-${targetArch}`);
    if (!(await fs.exists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    for (const target of targets) {
      const makeSpinner = ora.ora(`Making for target: ${target.cyan} - On platform: ${declaredPlatform.cyan} - For arch: ${targetArch.cyan}`).start();
      let maker;
      try {
        maker = require(`./makers/${process.platform}/${target}.js`);
      } catch (err1) {
        try {
          maker = require(`./makers/generic/${target}.js`);
        } catch (err2) {
          makeSpinner.fail();
          throw new Error(`Could not find a build target with the name: ${target} for the platform: ${declaredPlatform}`);
        }
      }
      try {
        await (maker.default || maker)(packageDir, appName, targetArch, forgeConfig, packageJSON);
      } catch (err) {
        makeSpinner.fail();
        if (err) throw err;
        throw new Error(`An error occurred while making for target: ${target}`);
      }
      makeSpinner.succeed();
    }
  }
};

main();
