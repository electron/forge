import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';

import './util/terminate';
import asyncOra from './util/ora-handler';
import electronHostArch from './util/electron-host-arch';
import getForgeConfig from './util/forge-config';
import packager from './electron-forge-package';
import readPackageJSON from './util/read-package-json';
import requireSearch from './util/require-search';
import resolveDir from './util/resolve-dir';

const main = async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--skip-package', 'Assume the app is already packaged')
    .option('-a, --arch [arch]', 'Target architecture')
    .option('-p, --platform [platform]', 'Target build platform')
    .option('-t, --targets [targets]', 'Override your make targets for this run')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  let forgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      // eslint-disable-next-line no-throw-literal
      throw 'Failed to locate makeable Electron application';
    }

    forgeConfig = await getForgeConfig(dir);
  });

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

  let targets = forgeConfig.make_targets[declaredPlatform];
  if (program.targets) {
    targets = program.targets.split(',');
  }

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
  const outputs = [];

  for (const targetArch of targetArchs) {
    const packageDir = path.resolve(dir, `out/${appName}-${declaredPlatform}-${targetArch}`);
    if (!(await fs.exists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    for (const target of targets) {
      // eslint-disable-next-line no-loop-func
      await asyncOra(`Making for target: ${target.cyan} - On platform: ${declaredPlatform.cyan} - For arch: ${targetArch.cyan}`, async () => {
        const maker = requireSearch(__dirname, [
          `./makers/${process.platform}/${target}.js`,
          `./makers/generic/${target}.js`,
          `electron-forge-maker-${target}`,
        ]);
        if (!maker) {
          // eslint-disable-next-line no-throw-literal
          throw `Could not find a build target with the name: ${target} for the platform: ${declaredPlatform}`;
        }
        try {
          outputs.push(await (maker.default || maker)(packageDir, appName, targetArch, forgeConfig, packageJSON));
        } catch (err) {
          if (err) {
            // eslint-disable-next-line no-throw-literal
            throw {
              message: `An error occured while making for target: ${target}`,
              stack: `${err.message}\n${err.stack}`,
            };
          } else {
            throw new Error(`An unknown error occured while making for target: ${target}`);
          }
        }
      });
    }
  }

  return outputs;
};

if (process.mainModule === module) {
  main();
}

export default main;
