import { spawn } from 'child_process';
import debug from 'debug';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import ora from 'ora';
import os from 'os';
import path from 'path';
import pify from 'pify';

const d = debug('electron-forge:rebuild');

export default async (buildPath, electronVersion, pPlatform, pArch) => {
  const rebuilds = [];

  const rebuildModuleAt = async (modulePath) => {
    if (await fs.exists(path.resolve(modulePath, 'binding.gyp'))) {
      const metaPath = path.resolve(modulePath, 'build', 'Release', '.forge-meta');
      if (await fs.exists(metaPath)) {
        const meta = await fs.readFile(metaPath, 'utf8');
        if (meta === pArch) {
          d(`skipping: ${path.basename(modulePath)} as it is already built`);
          return;
        }
      }
      d('rebuilding:', path.basename(modulePath));
      const rebuildArgs = [
        'rebuild',
        `--target=${electronVersion}`,
        `--arch=${pArch}`,
        '--dist-url=https://atom.io/download/electron',
        '--build-from-source',
      ];

      const modulePackageJSON = JSON.parse(await fs.readFile(path.resolve(modulePath, 'package.json')));
      Object.keys(modulePackageJSON.binary || {}).forEach((binaryKey) => {
        let value = modulePackageJSON.binary[binaryKey];
        if (binaryKey === 'module_path') {
          value = path.resolve(modulePath, value);
        }
        rebuildArgs.push(`--${binaryKey}=${value}`);
      });

      await new Promise((resolve, reject) => {
        const child = spawn(path.resolve(__dirname, `../../node_modules/.bin/node-gyp${process.platform === 'win32' ? '.cmd' : ''}`), rebuildArgs, {
          cwd: modulePath,
          env: Object.assign({}, process.env, {
            HOME: path.resolve(os.homedir(), '.electron-gyp'),
            USERPROFILE: path.resolve(os.homedir(), '.electron-gyp'),
            npm_config_disturl: 'https://atom.io/download/electron',
            npm_config_runtime: 'electron',
            npm_config_arch: pArch,
            npm_config_target_arch: pArch,
            npm_config_build_from_source: true,
          }),
        });
        let output = '';
        child.stdout.on('data', (data) => { output += data; });
        child.stderr.on('data', (data) => { output += data; });
        child.on('exit', async (code) => {
          d('built:', path.basename(modulePath));
          if (code !== 0) return reject(new Error(`Failed to rebuild: ${modulePath}\n\n${output}`));
          await pify(mkdirp)(path.dirname(metaPath));
          await fs.writeFile(metaPath, pArch);
          resolve();
        });
      });
    }
  };
  const rebuildAllModulesIn = (nodeModulesPath) => {
    for (const modulePath of fs.readdirSync(nodeModulesPath)) {
      rebuilds.push(rebuildModuleAt(path.resolve(nodeModulesPath, modulePath)));
      if (path.resolve(nodeModulesPath, modulePath).startsWith('@')) {
        rebuildAllModulesIn(path.resolve(nodeModulesPath, modulePath));
      }
      if (fs.existsSync(path.resolve(nodeModulesPath, modulePath, 'node_modules'))) {
        rebuildAllModulesIn(path.resolve(nodeModulesPath, modulePath, 'node_modules'));
      }
    }
  };
  const nativeSpinner = ora.ora('Preparing native dependencies').start();
  rebuildAllModulesIn(path.resolve(buildPath, 'node_modules'));
  try {
    await Promise.all(rebuilds);
  } catch (err) {
    nativeSpinner.fail();
    throw err;
  }
  nativeSpinner.succeed();
};
