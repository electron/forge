import path from 'path';

import { ForgeAppPackageJSON, PackageJSON, ResolvedForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';

import { runMutatingHook } from './hook';

export const readRawPackageJson = async (dir: string): Promise<PackageJSON> => fs.readJson(path.resolve(dir, 'package.json'));

export const readMutatedPackageJson = async (dir: string, forgeConfig: ResolvedForgeConfig): Promise<ForgeAppPackageJSON> =>
  runMutatingHook(forgeConfig, 'readPackageJson', await readRawPackageJson(dir)) as Promise<ForgeAppPackageJSON>;
