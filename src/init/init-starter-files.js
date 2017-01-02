import debug from 'debug';
import fs from 'fs-promise';
import path from 'path';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init:starter-files');

export const copy = (source, target) =>
  new Promise((resolve, reject) => {
    d(`copying "${source}" --> "${target}"`);
    let rd;
    let wr;
    const rejectCleanup = (err) => {
      rd.destroy();
      wr.end();
      reject(err);
    };
    rd = fs.createReadStream(source);
    rd.on('error', rejectCleanup);
    wr = fs.createWriteStream(target);
    wr.on('error', rejectCleanup);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });

export default async (dir, lintStyle) => {
  await asyncOra('Copying Starter Files', async () => {
    const tmplPath = path.resolve(__dirname, '../../tmpl');

    d('creating directory:', path.resolve(dir, 'src'));
    await fs.mkdirs(path.resolve(dir, 'src'));
    const rootFiles = ['_gitignore', '_compilerc'];
    if (lintStyle === 'airbnb') rootFiles.push('_eslintrc');
    const srcFiles = ['index.js', 'index.html'];

    rootFiles.forEach(async (file) => {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, file.replace(/^_/, '.')));
    });
    srcFiles.forEach(async (file) => {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, 'src', file));
    });
  });
};
