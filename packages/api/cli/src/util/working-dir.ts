import fs from 'fs-extra';
import path from 'path';

export default function (dir: string, cwd: string, checkExisting: boolean = true): string {
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
