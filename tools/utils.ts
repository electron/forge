import * as fs from 'fs-extra';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

export interface Package {
  path: string;
  name: string;
}

export const getPackageInfo = async () => {
  const packages: Package[] = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      const packagePath = path.resolve(PACKAGES_DIR, subDir, packageDir);
      packages.push({
        path: packagePath,
        name: (await fs.readJson(path.resolve(packagePath, 'package.json'))).name,
      });
    }
  }

  return packages;
};

export const getPackageInfoSync = () => {
  const packages: Package[] = [];

  for (const subDir of fs.readdirSync(PACKAGES_DIR)) {
    for (const packageDir of fs.readdirSync(path.resolve(PACKAGES_DIR, subDir))) {
      const packagePath = path.resolve(PACKAGES_DIR, subDir, packageDir);
      packages.push({
        path: packagePath,
        name: (fs.readJsonSync(path.resolve(packagePath, 'package.json'))).name,
      });
    }
  }

  return packages;
};
