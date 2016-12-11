import { spawn } from 'child_process';
import debug from 'debug';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import os from 'os';
import path from 'path';
import pify from 'pify';

const d = debug('electron-forge:rebuild');

export default async (buildPath, electronVersion, pPlatform, pArch, done) => {
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
      ];
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.resolve(__dirname, '../../node_modules/.bin/node-gyp')].concat(rebuildArgs), {
          cwd: modulePath,
          // stdio: 'inherit',
          env: Object.assign({}, process.env, {
            HOME: path.resolve(os.homedir(), '.electron-gyp'),
            USERPROFILE: path.resolve(os.homedir(), '.electron-gyp'),
            npm_config_disturl: 'https://atom.io/download/electron',
            npm_config_runtime: 'electron',
            npm_config_arch: pArch,
            npm_config_target_arch: pArch,
          }),
        });
        child.on('exit', async (code) => {
          d('built:', path.basename(modulePath));
          if (code !== 0) return reject(new Error(`Failed to rebuild: ${modulePath}`));
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
      if (fs.existsSync(path.resolve(nodeModulesPath, modulePath, 'node_modules'))) {
        rebuildAllModulesIn(path.resolve(nodeModulesPath, modulePath, 'node_modules'));
      }
    }
  };
  rebuildAllModulesIn(path.resolve(buildPath, 'node_modules'));
  await Promise.all(rebuilds);
  done();
};
