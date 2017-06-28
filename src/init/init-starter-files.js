import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:starter-files');

export const copy = (source, target) => {
  d(`copying "${source}" --> "${target}"`);
  fs.copy(source, target);
};

export default async (dir, lintStyle) => {
  await asyncOra('Copying Starter Files', async () => {
    const tmplPath = path.resolve(__dirname, '../../tmpl');

    d('creating directory:', path.resolve(dir, 'src'));
    await fs.mkdirs(path.resolve(dir, 'src'));
    const rootFiles = ['_gitignore', '_compilerc'];
    if (lintStyle === 'airbnb') rootFiles.push('_eslintrc');
    const srcFiles = ['index.js', 'index.html'];

    for (const file of rootFiles) {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, file.replace(/^_/, '.')));
    }
    for (const file of srcFiles) {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, 'src', file));
    }
  });
};
