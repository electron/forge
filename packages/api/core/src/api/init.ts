import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';

import initCustom from './init-scripts/init-custom';
import initDirectory from './init-scripts/init-directory';
import initGit from './init-scripts/init-git';
import initNPM from './init-scripts/init-npm';
import initStarter from './init-scripts/init-starter-files';

const d = debug('electron-forge:init');

export interface InitOptions {
  /**
   * The path to the app to be initialized
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to copy Travis and AppVeyor CI files
   */
  copyCIFiles?: boolean;
  /**
   * The custom template to use. If left empty, the default template is used
   */
  template?: string;
}

export default async ({
  dir = process.cwd(),
  interactive = false,
  copyCIFiles = false,
  template,
}: InitOptions) => {
  asyncOra.interactive = interactive;

  d(`Initializing in: ${dir}`);

  await initDirectory(dir);
  await initGit(dir);
  await initStarter(dir, { copyCIFiles });
  await initNPM(dir);
  if (template) {
    await initCustom(dir, template);
  }
};
