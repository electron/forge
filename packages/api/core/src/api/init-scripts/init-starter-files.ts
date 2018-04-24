import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

const d = debug('electron-forge:init:starter-files');

export const copy = async (source: string, target: string) => {
  d(`copying "${source}" --> "${target}"`);
  await fs.copy(source, target);
};

export interface InitStarterFilesOptions {
  copyCIFiles: boolean;
}

export default async (dir: string, { copyCIFiles }: InitStarterFilesOptions) => {
  await asyncOra('Copying Starter Files', async () => {
    const tmplPath = path.resolve(__dirname, '../../../tmpl');

    d('creating directory:', path.resolve(dir, 'src'));
    await fs.mkdirs(path.resolve(dir, 'src'));
    const rootFiles = ['_gitignore'];
    if (copyCIFiles) rootFiles.push(...['_travis.yml', '_appveyor.yml']);
    const srcFiles = ['index.js', 'index.html'];

    for (const file of rootFiles) {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, file.replace(/^_/, '.')));
    }
    for (const file of srcFiles) {
      await copy(path.resolve(tmplPath, file), path.resolve(dir, 'src', file));
    }
  });
};
