import * as path from 'path';

import * as fs from 'fs-extra';

import { getPackageInfo } from './utils';

(async () => {
  const packages = await getPackageInfo();

  const baseJson = await fs.readJson(path.resolve(__dirname, '..', 'package.json'));

  const allDeps = {
    ...baseJson.dependencies,
    ...baseJson.devDependencies,
    ...baseJson.optionalDependencies,
  };

  const result = await Promise.allSettled(
    packages.map(async (p) => {
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
    })
  );

  result.map((promise) => {
    if (promise.status === 'rejected') {
      console.error(promise);
    }
  });
})();
