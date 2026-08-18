import fs from 'node:fs/promises';
import * as path from 'node:path';

import { getPackageInfo } from './utils';

(async () => {
  const packages = await getPackageInfo();

  const baseJson = JSON.parse(
    await fs.readFile(
      path.resolve(import.meta.dirname, '..', 'package.json'),
      'utf8',
    ),
  );

  const allDeps = {
    ...baseJson.dependencies,
    ...baseJson.devDependencies,
    ...baseJson.optionalDependencies,
  };

  for (const p of packages) {
    const json = JSON.parse(
      await fs.readFile(path.resolve(p.path, 'package.json'), 'utf8'),
    );

    for (const key of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
    ]) {
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

    await fs.writeFile(
      path.resolve(p.path, 'package.json'),
      `${JSON.stringify(json, null, 2)}\n`,
    );
  }
})().catch(console.error);
