import path from 'path';

import fs from 'fs-extra';

export default function workingDir(dir: string, cwd: string, checkExisting = true): string {
  let finalDir = dir;
  if (cwd) {
    if (path.isAbsolute(cwd) && (!checkExisting || fs.existsSync(cwd))) {
      finalDir = cwd;
    } else {
      const resolved = path.resolve(finalDir, cwd);
      if (!checkExisting || fs.existsSync(resolved)) {
        finalDir = resolved;
      }
    }
  }

  return finalDir;
}
