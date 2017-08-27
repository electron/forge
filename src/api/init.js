import debug from 'debug';

import initCustom from '../init/init-custom';
import initDirectory from '../init/init-directory';
import initGit from '../init/init-git';
import initNPM from '../init/init-npm';
import initStandardFix from '../init/init-standard-fix';
import initStarter from '../init/init-starter-files';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:init');

/**
 * @typedef {Object} InitOptions
 * @property {string} [dir=process.cwd()] The path to the app to be initialized
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {string} [lintStyle=airbnb] The lintStyle to pass through to the template creator
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
  let { dir, interactive, lintStyle, copyCIFiles, template } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    lintStyle: 'airbnb',
    copyCIFiles: false,
    template: null,
  }, providedOptions);
  asyncOra.interactive = interactive;

  d(`Initializing in: ${dir}`);

  if (!template) {
    lintStyle = lintStyle.toLowerCase();
    if (!['airbnb', 'standard'].includes(lintStyle)) {
      d(`Unrecognized lintStyle argument: '${lintStyle}' -- defaulting to 'airbnb'`);
      lintStyle = 'airbnb';
    }
  }

  await initDirectory(dir, interactive);
  await initGit(dir);
  await initStarter(dir, { lintStyle: template ? undefined : lintStyle, copyCIFiles });
  await initNPM(dir, template ? undefined : lintStyle);
  if (!template) {
    if (lintStyle === 'standard') {
      await initStandardFix(dir);
    }
  } else {
    await initCustom(dir, template, lintStyle);
  }
};
