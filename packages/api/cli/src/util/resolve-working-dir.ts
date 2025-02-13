import path from 'node:path';

import fs from 'fs-extra';

/**
 * Resolves the directory in which to use
 * @param dir - The directory specified by the user (can be relative or absolute)
 * @param checkExisting - Checks if the directory already exists
 * @returns
 */
export function resolveWorkingDir(dir: string, checkExisting = true): string {
  let finalDir = process.cwd();
  if (dir) {
    if (path.isAbsolute(dir) && (!checkExisting || fs.existsSync(dir))) {
      finalDir = dir;
    } else {
      const resolved = path.resolve(finalDir, dir);
      if (!checkExisting || fs.existsSync(resolved)) {
        finalDir = resolved;
      }
    }
  }

  return finalDir;
}
