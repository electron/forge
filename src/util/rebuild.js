import { spawn } from 'child_process';
import debug from 'debug';
import fs from 'fs-promise';
import ora from 'ora';
import os from 'os';
import path from 'path';
import readPackageJSON from './read-package-json';

const d = debug('electron-forge:rebuild');

export default async (buildPath, electronVersion, pPlatform, pArch) => {
  const rebuilds = [];
  let rebuildCount = 0;
  let rebuildCompleteCount = 0;
  const prodDeps = {};

  const nativeSpinner = ora.ora(`Preparing native dependencies ${rebuildCompleteCount}/${rebuildCount}`).start();
  const updateNativeSpinner = () => {
    nativeSpinner.text = `Preparing native dependencies ${rebuildCompleteCount}/${rebuildCount}`;
  };

  const rebuildModuleAt = async (modulePath) => {
    if (await fs.exists(path.resolve(modulePath, 'binding.gyp'))) {
      const metaPath = path.resolve(modulePath, 'build', 'Release', '.forge-meta');
      rebuildCount += 1;
      updateNativeSpinner();
      if (await fs.exists(metaPath)) {
        const meta = await fs.readFile(metaPath, 'utf8');
        if (meta === pArch) {
          d(`skipping: ${path.basename(modulePath)} as it is already built`);
          rebuildCompleteCount += 1;
          updateNativeSpinner();
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

      const modulePackageJSON = await readPackageJSON(modulePath);
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
          await fs.mkdirs(path.dirname(metaPath));
          await fs.writeFile(metaPath, pArch);
          rebuildCompleteCount += 1;
          updateNativeSpinner();
          resolve();
        });
      });
    }
  };

  const rebuildAllModulesIn = (nodeModulesPath, prefix = '') => {
    d('scanning:', nodeModulesPath);
    for (const modulePath of fs.readdirSync(nodeModulesPath)) {
      if (prodDeps[`${prefix}${modulePath}`]) {
        rebuilds.push(rebuildModuleAt(path.resolve(nodeModulesPath, modulePath)));
      }
      if (modulePath.startsWith('@')) {
        rebuildAllModulesIn(path.resolve(nodeModulesPath, modulePath), `${modulePath}/`);
      }
      if (fs.existsSync(path.resolve(nodeModulesPath, modulePath, 'node_modules'))) {
        rebuildAllModulesIn(path.resolve(nodeModulesPath, modulePath, 'node_modules'));
      }
    }
  };

  const findModule = async (moduleName, fromDir, foundFn) => {
    let targetDir = fromDir;
    const foundFns = [];
    while (targetDir !== buildPath) {
      const testPath = path.resolve(targetDir, 'node_modules', moduleName);
      if (await fs.exists(testPath)) {
        foundFns.push(foundFn(testPath));
      }
      targetDir = path.dirname(targetDir);
    }
    await Promise.all(foundFns);
  };

  const markChildrenAsProdDeps = async (modulePath) => {
    d('exploring:', modulePath);
    let childPackageJSON;
    try {
      childPackageJSON = await readPackageJSON(modulePath);
    } catch (err) {
      return;
    }
    const moduleWait = [];
    Object.keys(childPackageJSON.dependencies || {}).forEach((key) => {
      if (prodDeps[key]) return;
      prodDeps[key] = true;
      moduleWait.push(findModule(key, modulePath, markChildrenAsProdDeps));
    });
    await Promise.all(moduleWait);
  };

  const rootPackageJSON = await readPackageJSON(buildPath);
  const markWaiters = [];
  Object.keys(rootPackageJSON.dependencies || {}).concat(Object.keys(rootPackageJSON.optionalDependencies || {})).forEach((key) => {
    prodDeps[key] = true;
    markWaiters.push(markChildrenAsProdDeps(path.resolve(buildPath, 'node_modules', key)));
  });

  await Promise.all(markWaiters);

  rebuildAllModulesIn(path.resolve(buildPath, 'node_modules'));
  try {
    await Promise.all(rebuilds);
  } catch (err) {
    nativeSpinner.fail();
    throw err;
  }
  nativeSpinner.succeed();
};
