import fs from 'fs-extra';
import path from 'path';
import program from 'commander';

export default async () => program.version((await fs.readJson('../../package.json')).version);

export function workingDir(dir: string, cwd: string, checkExisting: boolean = true): string {
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
