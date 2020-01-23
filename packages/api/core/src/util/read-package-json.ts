import { ForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';

import { runMutatingHook } from './hook';

export const readRawPackageJson = async (dir: string) => fs.readJson(path.resolve(dir, 'package.json'));

export const readMutatedPackageJson = async (dir: string, forgeConfig: ForgeConfig) => runMutatingHook(forgeConfig, 'readPackageJson', await readRawPackageJson(dir));
