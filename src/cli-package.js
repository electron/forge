import 'colors';
import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import resolveDir from './util/resolve-dir';

const main = async () => {
  const startSpinner = ora('Packaging Application').start();
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
    console.error('Failed to locate packagable Electron application'.red);
    startSpinner.fail();
    process.exit(1);
  }

  const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));

  const arch = program.arch || process.arch;
  const platform = program.platform || process.platform;

  const child = spawn('node', [
    path.resolve(dir, 'node_modules/electron-compile/lib/packager-cli.js'),
    `${dir}`,
    packageJSON.productName,
    `--arch=${arch}`,
    `--platform=${platform}`,
    `--version=${packageJSON.dependencies['electron-prebuilt-compile']}`,
    // '--overwrite',
  ].concat(process.argv.filter((arg, i) => i >= cutoff)), {});
  const output = [];
  child.stdout.on('data', data => output.push(data));
  child.stderr.on('data', data => output.push(data));
  child.on('exit', (code) => {
    if (code === 0) startSpinner.succeed();
    if (code !== 0) {
      output.forEach(data => process.stdout.write(data));
      startSpinner.fail();
    }
  });
};

main();
