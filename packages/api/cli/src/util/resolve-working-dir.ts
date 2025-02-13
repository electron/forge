import path from 'node:path';

import fs from 'fs-extra';

/**
 * Resolves the directory in which to use a CLI command.
 * @param dir - The directory specified by the user (can be relative or absolute)
 * @param checkExisting - Checks if the directory exists. If true and directory is non-existent, it will fall back to the current working directory
 * @returns
 */
export function resolveWorkingDir(dir: string, checkExisting = true): string {
  if (!dir) {
    return process.cwd();
  }

  const resolved = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);

  if (checkExisting && !fs.existsSync(resolved)) {
    return process.cwd();
  } else {
    return resolved;
  }
}
