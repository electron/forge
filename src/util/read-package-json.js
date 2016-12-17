import fs from 'fs-promise';
import path from 'path';

export default (dir) => {
  const packageData = fs.readFileSync(path.resolve(dir, 'package.json'), 'utf8');
  return JSON.parse(packageData);
};
