import fs from 'fs-promise';
import path from 'path';

export default async (dir) => {
  const packageData = await fs.readFile(path.resolve(dir, 'package.json'), 'utf8');
  return JSON.parse(packageData);
};
