import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Walk up the directory tree from `cwd` looking for the first file whose
 * basename matches one of `names`. Returns the absolute path, or `undefined`
 * if the filesystem root is reached without a match.
 */
export async function findUp(
  names: string[],
  options: { cwd?: string } = {},
): Promise<string | undefined> {
  let dir = path.resolve(options.cwd ?? process.cwd());
  let prev: string | undefined;

  while (dir !== prev) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      try {
        const stats = await fs.stat(candidate);
        if (stats.isFile()) {
          return candidate;
        }
      } catch {
        // file does not exist at this level, keep looking
      }
    }

    prev = dir;
    dir = path.dirname(dir);
  }

  return undefined;
}
