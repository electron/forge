import path from 'node:path';

import { readJson } from '@electron-forge/core-utils';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';

import { runMutatingHook } from './hook.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readRawPackageJson = async (dir: string): Promise<any> =>
  readJson(path.resolve(dir, 'package.json'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readMutatedPackageJson = async (
  dir: string,
  forgeConfig: ResolvedForgeConfig,
): Promise<any> =>
  runMutatingHook(
    forgeConfig,
    'readPackageJson',
    await readRawPackageJson(dir),
  );
