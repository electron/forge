import fs from 'fs-extra';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.resolve(BASE_DIR, 'docs');

(async () => {
  await fs.copy(path.resolve(BASE_DIR, '.now.json'), path.resolve(DOCS_DIR, 'now.json'));
})();
