import fs from 'fs-promise';
import path from 'path';

export default async (dir) => {
  let mDir = dir;
  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    const testPath = path.resolve(mDir, 'package.json');
    if (await fs.exists(testPath)) {
      const packageJSON = JSON.parse(await fs.readFile(testPath, 'utf8'));
      if (packageJSON.config && packageJSON.config.forge) return mDir;
    }
    mDir = path.dirname(mDir);
  }
  return null;
};
