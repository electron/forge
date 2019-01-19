/* eslint "global-require": "off", "import/no-dynamic-require": "off" */
import minimist from 'minimist';
import * as path from 'path';
import Glob from 'glob';

import { getPackageInfoSync } from './utils';

const argv = minimist(
  process.argv.slice(
    process.argv.findIndex(arg => arg === 'mocha.opts'),
  ),
);

const isFast = argv.fast;

const packages = getPackageInfoSync();
const testFiles: string[] = [];

for (const p of packages) {
  if (argv.match && !p.name.includes(argv.match)) continue;

  testFiles.push(...Glob.sync(path.resolve(p.path, 'test', '**', `*_spec${isFast ? '' : '*'}.ts`)));
}

for (const f of testFiles) {
  require(f);
}
