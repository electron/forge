import url from 'node:url';
import { styleText } from 'node:util';

import './util/terminate.js';

import { runRelease } from './electron-forge-release.js';

// `electron-forge publish` is a deprecated alias for `electron-forge release`.
// It keeps working for now but prints a deprecation warning to stderr and
// delegates to the exact same behavior as `release`.
if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    console.error(
      styleText('yellow', '⚠'),
      '`electron-forge publish` is deprecated and will be removed in a future major version; use `electron-forge release` instead.',
    );

    await runRelease();
  }
}
