import fs from 'fs-extra';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const SHARED_TYPES_DIR = path.resolve(BASE_DIR, 'packages', 'utils', 'types');

(async () => {
  const content = await fs.readFile(path.resolve(SHARED_TYPES_DIR, 'src', 'index.ts'), 'utf8');
  await fs.writeFile(path.resolve(SHARED_TYPES_DIR, 'index.d.ts'), content);
})();
