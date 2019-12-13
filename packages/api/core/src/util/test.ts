import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

let dirID = Date.now();

export async function ensureTestDirIsNonexistent(): Promise<string> {
  const dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
  dirID += 1;
  await fs.remove(dir);

  return dir;
};

export async function expectProjectPathExists(dir: string, subPath: string, pathType: string, exists = true) {
  expect(await fs.pathExists(path.resolve(dir, subPath)), `the ${subPath} ${pathType} should exist`).to.equal(exists);
};

export async function expectProjectPathNotExists(dir: string, subPath: string, pathType: string) {
  await expectProjectPathExists(dir, subPath, pathType, false);
};

