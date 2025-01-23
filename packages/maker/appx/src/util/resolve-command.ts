/**
 * This code is vendored from cross-spawn@7.0.6
 * https://github.com/moxystudio/node-cross-spawn/blob/master/lib/util/resolveCommand.js
 */

import path from 'node:path';

import getPathKey from 'path-key';
import which from 'which';

function resolveCommandAttempt(parsed: { command: string; options: { env?: any; cwd?: any } }, withoutPathExt?: boolean) {
  const env = parsed.options.env || process.env;
  const cwd = process.cwd();
  const hasCustomCwd = parsed.options.cwd != null;
  // Worker threads do not have process.chdir()
  //@ts-expect-error we want to keep this code as close as the original as possible
  const shouldSwitchCwd = hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled;

  // If a custom `cwd` was specified, we need to change the process cwd
  // because `which` will do stat calls but does not support a custom cwd
  if (shouldSwitchCwd) {
    try {
      process.chdir(parsed.options.cwd);
    } catch {
      /* Empty */
    }
  }

  let resolved;

  try {
    resolved = which.sync(parsed.command, {
      path: env[getPathKey({ env })],
      pathExt: withoutPathExt ? path.delimiter : undefined,
    });
  } catch {
    /* Empty */
  } finally {
    if (shouldSwitchCwd) {
      process.chdir(cwd);
    }
  }

  // If we successfully resolved, ensure that an absolute path is returned
  // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
  if (resolved) {
    resolved = path.resolve(hasCustomCwd ? parsed.options.cwd : '', resolved);
  }

  return resolved;
}

export function resolveCommand(parsed: { command: string; options: { env?: any; cwd?: any } }) {
  return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}
