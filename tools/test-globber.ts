/* eslint "global-require": "off", "import/no-dynamic-require": "off" */
import globby from 'globby';
import minimist from 'minimist';
import * as path from 'path';

import { getPackageInfoSync } from './utils';

const argv = minimist(
  process.argv.slice(
    process.argv.findIndex((arg) => arg === 'mocha.opts'),
  ),
);

const isFast = argv.fast;

const packages = getPackageInfoSync();
const testFiles: string[] = [];

for (const p of packages) {
  if (argv.match && !p.name.includes(argv.match)) continue;

  const apiSpec = path.resolve(p.path, 'test', 'slow', 'api_spec_slow.ts');
  const specGlob: string[] = [];

  if (argv.integration) {
    specGlob.push(apiSpec);
  } else if (argv.glob) {
    specGlob.push(path.resolve(p.path, argv.glob));
  } else {
    specGlob.push(path.resolve(p.path, 'test', '**', `*_spec${isFast ? '' : '*'}.ts`));
  }

  if (argv.integration === false) {
    specGlob.push(`!${apiSpec}`);
  }
  testFiles.push(...globby.sync(specGlob));
}

for (const f of testFiles) {
  require(f);
}
