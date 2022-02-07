import { ForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';

import { runMutatingHook } from './hook';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readRawPackageJson = async (dir: string): Promise<any> => fs.readJson(path.resolve(dir, 'package.json'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readMutatedPackageJson = async (dir: string, forgeConfig: ForgeConfig): Promise<any> =>
  runMutatingHook(forgeConfig, 'readPackageJson', await readRawPackageJson(dir));
