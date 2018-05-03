import * as fs from 'fs-extra';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

(async () => {
  const dirsToLink = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      dirsToLink.push(path.resolve(PACKAGES_DIR, subDir, packageDir));
    }
  }

  for (const dir of dirsToLink) {
    await fs.copy(path.resolve(BASE_DIR, 'tsconfig.json'), path.resolve(dir, 'tsconfig.json'));
    await fs.copy(path.resolve(BASE_DIR, 'tslint.json'), path.resolve(dir, 'tslint.json'));
  }
})();
