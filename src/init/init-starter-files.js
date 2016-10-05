import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import ora from 'ora';
import path from 'path';

const copy = (source, target) =>
  new Promise((resolve, reject) => {
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

export default async (dir) => {
  const initSpinner = ora('Copying Starter Files').start();
  const tmplPath = path.resolve(__dirname, '../../tmpl');

  mkdirp.sync(path.resolve(dir, 'src'));
  const rootFiles = ['_gitignore', '_eslintrc'];
  const srcFiles = ['index.js', 'index.html'];

  rootFiles.forEach(async (file) => {
    await copy(path.resolve(tmplPath, file), path.resolve(dir, file.replace(/^_/, '.')));
  });
  srcFiles.forEach(async (file) => {
    await copy(path.resolve(tmplPath, file), path.resolve(dir, 'src', file));
  });

  initSpinner.succeed();
};
