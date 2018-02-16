import fs from 'fs-extra';
import path from 'path';

// This is different from fs-extra's ensureDir because it wipes out the existing directory,
// if it's found.
async function ensureDirectory(dir) {
  if (await fs.pathExists(dir)) {
    await fs.remove(dir);
  }
  return fs.mkdirs(dir);
}

// This is different from fs-extra's ensureFile because it wipes out the existing file,
// if it's found.
async function ensureFile(file) {
  if (await fs.pathExists(file)) {
    await fs.remove(file);
  }
  await fs.mkdirs(path.dirname(file));
}

export { ensureDirectory, ensureFile };
