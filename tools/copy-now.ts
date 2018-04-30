import fs from 'fs-extra';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const BOOK_DIR = path.resolve(BASE_DIR, 'docs', '_book');

(async () => {
  await fs.copy(path.resolve(BASE_DIR, '.now.json'), path.resolve(BOOK_DIR, 'now.json'));
})()