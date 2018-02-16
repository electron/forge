import fs from 'fs-extra';
import path from 'path';

export default async dir =>
  await fs.readJson(path.resolve(dir, 'package.json'));
