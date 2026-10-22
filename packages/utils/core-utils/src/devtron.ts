import { createRequire } from 'node:module';
import path from 'node:path';
import { styleText } from 'node:util';

import debug from 'debug';
import semver from 'semver';

import { getElectronVersion } from './electron-version.js';
import { readJson } from './fs.js';

const d = debug('electron-forge:core-utils:devtron');

/**
 * Devtron loads as a DevTools extension via APIs that only exist in
 * Electron >= 36.
 */
export const DEVTRON_MIN_ELECTRON_VERSION = '36.0.0';

/**
 * Main process bootstrap code that installs the Devtron DevTools extension.
 *
 * This snippet is prepended verbatim to the compiled main process bundle in
 * development, so it is plain CommonJS and guards itself against every
 * context it could accidentally run in: packaged apps, non-main Electron
 * processes, and ESM output where `require` is not defined.
 */
export function getDevtronBootstrapCode(): string {
  return `;(function () {
  try {
    if (typeof require !== 'function' || typeof process === 'undefined' || process.type !== 'browser') {
      return;
    }
    var electron = require('electron');
    if (!electron || !electron.app || electron.app.isPackaged) {
      return;
    }
    Promise.resolve()
      .then(function () { return require('@electron/devtron').devtron.install(); })
      .catch(function (err) {
        console.warn('[electron-forge] Failed to install Devtron:', err);
      });
  } catch (err) {
    console.warn('[electron-forge] Failed to install Devtron:', err);
  }
})();
`;
}

/**
 * Determines whether the Devtron bootstrap can be injected into the app's
 * main process bundle.
 *
 * Throws if `@electron/devtron` is not installed in the project, since the
 * bootstrap resolves it from the app's `node_modules` at runtime. Returns
 * false (with a warning) if the project's Electron version is too old to
 * support Devtron.
 */
export async function canInjectDevtron(projectDir: string): Promise<boolean> {
  const projectRequire = createRequire(path.join(projectDir, 'package.json'));
  try {
    projectRequire.resolve('@electron/devtron');
  } catch {
    throw new Error(
      `The "devtron" option is enabled, but "@electron/devtron" could not be resolved from ${projectDir}. ` +
        'Install it as a devDependency of your app, e.g. "npm install --save-dev @electron/devtron".',
    );
  }

  let electronVersion: string;
  try {
    const packageJSON = await readJson(path.join(projectDir, 'package.json'));
    electronVersion = await getElectronVersion(projectDir, packageJSON);
  } catch (err) {
    // If we can't determine the Electron version, optimistically inject; the
    // bootstrap itself fails soft inside the app.
    d('could not determine Electron version for devtron check:', err);
    return true;
  }

  const parsed = semver.coerce(electronVersion);
  if (parsed && semver.lt(parsed, DEVTRON_MIN_ELECTRON_VERSION)) {
    console.warn(
      styleText(
        'yellow',
        `Devtron requires Electron >= ${DEVTRON_MIN_ELECTRON_VERSION}, but this app uses Electron ${electronVersion}. Skipping Devtron installation.`,
      ),
    );
    return false;
  }

  return true;
}
