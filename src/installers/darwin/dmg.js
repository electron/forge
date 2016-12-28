import fs from 'fs-promise';
import opn from 'opn';
import path from 'path';
import pify from 'pify';
import { exec } from 'child_process';

export default async (filePath) => {
  const DMGPath = path.join(path.dirname(filePath), path.parse(filePath).name);
  if (await fs.exists(DMGPath)) {
    await fs.remove(DMGPath);
  }
  await pify(exec)(`cp "${filePath}" "${DMGPath}"`);
  await opn(DMGPath, { wait: false });
};
