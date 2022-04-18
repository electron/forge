import * as fs from 'fs-extra';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

export interface Package {
  path: string;
  name: string;
  manifest: object; // the parsed package.json
}

export const getPackageInfo = async (): Promise<Package[]> => {
  const packages: Package[] = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      const packagePath = path.resolve(PACKAGES_DIR, subDir, packageDir);
      const pkg = await fs.readJson(path.resolve(packagePath, 'package.json'));
      packages.push({
        path: packagePath,
        name: pkg.name,
        manifest: pkg,
      });
    }
  }

  return packages;
};

export const getPackageInfoSync = (): Package[] => {
  const packages: Package[] = [];

  for (const subDir of fs.readdirSync(PACKAGES_DIR)) {
    for (const packageDir of fs.readdirSync(path.resolve(PACKAGES_DIR, subDir))) {
      const packagePath = path.resolve(PACKAGES_DIR, subDir, packageDir);
      const pkg = fs.readJsonSync(path.resolve(packagePath, 'package.json'));
      packages.push({
        path: packagePath,
        name: pkg.name,
        manifest: pkg,
      });
    }
  }

  return packages;
};
