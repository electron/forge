import debug from 'debug';

import initCustom from './init-scripts/init-custom';
import initDirectory from './init-scripts/init-directory';
import initGit from './init-scripts/init-git';
import initNPM from './init-scripts/init-npm';
import initStarter from './init-scripts/init-starter-files';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init');

/**
 * @typedef {Object} InitOptions
 * @property {string} [dir=process.cwd()] The path to the app to be initialized
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [copyCIFiles=false] Whether to copy Travis and AppVeyor CI files
 * @property {string} [template] The custom template to use. If left empty, the default template is used
 */

/**
 * Initialize a new Electron Forge template project in the given directory.
 *
 * @param {InitOptions} providedOptions - Options for the init method
 * @return {Promise} Will resolve when the initialization process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, copyCIFiles, template } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    copyCIFiles: false,
    template: null,
  }, providedOptions);
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
