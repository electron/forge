import fs from 'node:fs';
import path from 'node:path';

import { getPackageInfoSync } from './utils';

const nodeVersion = process.argv[2];

for (const { path: packagePath } of getPackageInfoSync()) {
  const filename = path.join(packagePath, 'package.json');
  const packageJSON = JSON.parse(fs.readFileSync(filename, 'utf8'));
  packageJSON.engines.node = `>= ${nodeVersion}`;
  fs.writeFileSync(filename, `${JSON.stringify(packageJSON, null, 2)}\n`);
}
