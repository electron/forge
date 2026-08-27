import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

const BASE_DIR = path.resolve(import.meta.dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

export interface Package {
  path: string;
  name: string;
  manifest: Record<string, unknown>; // the parsed package.json
}

export const getPackageInfo = async (): Promise<Package[]> => {
  const packages: Package[] = [];

  for (const subDir of await fsPromises.readdir(PACKAGES_DIR)) {
    const subDirPath = path.resolve(PACKAGES_DIR, subDir);
    const stat = await fsPromises.lstat(subDirPath);

    if (stat.isDirectory()) {
      for (const packageDir of await fsPromises.readdir(subDirPath)) {
        const packagePath = path.resolve(subDirPath, packageDir);
        const pkg = JSON.parse(
          await fsPromises.readFile(
            path.resolve(packagePath, 'package.json'),
            'utf8',
          ),
        );
        packages.push({
          path: packagePath,
          name: pkg.name,
          manifest: pkg,
        });
      }
    }
  }

  return packages;
};

export const getPackageInfoSync = (): Package[] => {
  const packages: Package[] = [];

  for (const subDir of fs.readdirSync(PACKAGES_DIR)) {
    const subDirPath = path.resolve(PACKAGES_DIR, subDir);
    const stat = fs.lstatSync(subDirPath);
    if (stat.isDirectory()) {
      for (const packageDir of fs.readdirSync(subDirPath)) {
        const packagePath = path.resolve(subDirPath, packageDir);
        const pkg = JSON.parse(
          fs.readFileSync(path.resolve(packagePath, 'package.json'), 'utf8'),
        );
        packages.push({
          path: packagePath,
          name: pkg.name,
          manifest: pkg,
        });
      }
    }
  }

  return packages;
};
