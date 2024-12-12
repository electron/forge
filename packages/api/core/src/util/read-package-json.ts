import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';

import { runMutatingHook } from './hook';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readRawPackageJson = async (dir: string): Promise<any> => fs.readJson(path.resolve(dir, 'package.json'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readMutatedPackageJson = async (dir: string, forgeConfig: ResolvedForgeConfig): Promise<any> =>
  runMutatingHook(forgeConfig, 'readPackageJson', await readRawPackageJson(dir));
