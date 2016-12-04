import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import path from 'path';
import pify from 'pify';
import rimraf from 'rimraf';

async function ensureDirectory(dir) {
  if (await fs.exists(dir)) {
    await pify(rimraf)(dir);
  }
  return pify(mkdirp)(dir);
}

async function ensureFile(file) {
  if (await fs.exists(file)) {
    await pify(rimraf)(file);
  }
  await pify(mkdirp)(path.dirname(file));
}

export { ensureDirectory, ensureFile };
