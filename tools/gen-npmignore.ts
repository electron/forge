import { promises as fs } from 'fs';
import path from 'path';

import { getPackageInfo } from './utils';

(async () => {
  // Use the .npmignore in the root of the project
  const DEFAULT_NPMIGNORE = await fs.readFile(path.join(__dirname, '../.npmignore'), 'utf-8');
  const packages = await getPackageInfo();

  return await Promise.all(
    packages.map(async (pkg) => {
      // Sync .npmignre to the package dir
      return await fs.writeFile(path.join(pkg.path, '.npmignore'), DEFAULT_NPMIGNORE);
    })
  );
})().catch(console.error);
