import * as fs from 'fs-extra';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(BASE_DIR, 'dist');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

(async () => {
  const dirsToLink = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      dirsToLink.push(path.join(subDir, packageDir));
    }
  }

  for (const dir of dirsToLink) {
    const targetDir = path.resolve(BASE_DIR, 'packages', dir, 'dist');
    await fs.mkdirp(targetDir);
    await fs.copy(path.resolve(DIST_DIR, dir, 'src'), targetDir);
  }
})();
