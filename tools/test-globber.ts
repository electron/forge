import * as path from 'path';

import glob from 'fast-glob';
import minimist from 'minimist';

import { getPackageInfoSync } from './utils';

const argv = minimist(process.argv.slice(process.argv.findIndex((arg) => arg === 'mocha.opts')));

const isSlow = argv.slow || process.env.TEST_SLOW_ONLY;
const isFast = argv.fast || process.env.TEST_FAST_ONLY;

const packages = getPackageInfoSync();
const testFiles: string[] = [];

for (const p of packages) {
  if (argv.match && !p.name.includes(argv.match)) continue;

  // normalize for Windows
  const packagePath = p.path.replace(/\\/g, '/');
  const specGlob: string[] = [];

  if (argv.glob) {
    specGlob.push(path.posix.join(packagePath, argv.glob));
  } else {
    specGlob.push(path.posix.join(packagePath, 'test', '**', `*_spec${isFast ? '' : isSlow ? '_slow' : '*'}.ts`));
  }
  testFiles.push(...glob.sync(specGlob));
}

for (const f of testFiles) {
  require(f);
}
