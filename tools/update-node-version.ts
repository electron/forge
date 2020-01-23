#!/usr/bin/env ts-node

import path from 'path';
import { readJsonSync, writeJsonSync } from 'fs-extra';

import { getPackageInfoSync } from './utils';

const nodeVersion = process.argv[2];

for (const { path: packagePath } of getPackageInfoSync()) {
  const filename = path.join(packagePath, 'package.json');
  const packageJSON = readJsonSync(filename);
  packageJSON.engines.node = `>= ${nodeVersion}`;
  writeJsonSync(filename, packageJSON, { spaces: 2 });
}
