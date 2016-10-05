import fs from 'fs-promise';
import path from 'path';

export default async (dir) => {
  let mDir = dir;
  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    if (await fs.exists(path.resolve(mDir, 'package.json'))) {
      return mDir;
    }
    mDir = path.dirname(mDir);
  }
  return null;
};
