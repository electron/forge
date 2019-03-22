import * as fs from 'fs-extra';
import * as path from 'path';

import { getPackageInfo } from './utils';

(async () => {
  const packages = await getPackageInfo();

  const baseJson = await fs.readJson(path.resolve(__dirname, '..', 'package.json'));

  const allDeps = {
    ...baseJson.dependencies,
    ...baseJson.devDependencies,
    ...baseJson.optionalDependencies,
  };

  for (const p of packages) {
    const json = await fs.readJson(path.resolve(p.path, 'package.json'));

    for (const key of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      const deps = json[key];
      if (!deps) continue;

      for (const depKey in deps) {
        if (depKey.startsWith('@electron-forge/')) continue;

        if (deps[depKey] !== allDeps[depKey]) {
          console.error(p.name, depKey, deps[depKey], '-->', allDeps[depKey]);
          deps[depKey] = allDeps[depKey];
        }
      }
    }

    await fs.writeJson(path.resolve(p.path, 'package.json'), json, {
      spaces: 2,
    });
  }
})().catch(console.error);
