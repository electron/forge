import debug from 'debug';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import ora from 'ora';
import path from 'path';
import pify from 'pify';

const d = debug('electron-forge:init:starter-files');

const copy = (source, target) =>
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
  const initSpinner = ora.ora('Copying Starter Files').start();
  const tmplPath = path.resolve(__dirname, '../../tmpl');

  d('creating directory:', path.resolve(dir, 'src'));
  await pify(mkdirp)(path.resolve(dir, 'src'));
  const rootFiles = ['_gitignore'];
  if (lintStyle === 'airbnb') rootFiles.push('_eslintrc');
  const srcFiles = ['index.js', 'index.html'];

  rootFiles.forEach(async (file) => {
    await copy(path.resolve(tmplPath, file), path.resolve(dir, file.replace(/^_/, '.')));
  });
  srcFiles.forEach(async (file) => {
    await copy(path.resolve(tmplPath, file), path.resolve(dir, 'src', file));
  });

  initSpinner.succeed();
};
