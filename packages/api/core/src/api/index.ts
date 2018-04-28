import 'colors';
import { ForgeMakeResult } from '@electron-forge/shared-types';
import { ChildProcess } from 'child_process';

import _import, { ImportOptions } from './import';
import init, { InitOptions } from './init';
import install, { InstallOptions, Asset as InstallAsset } from './install';
import lint, { LintOptions } from './lint';
import make, { MakeOptions } from './make';
import _package, { PackageOptions } from './package';
import publish, { PublishOptions } from './publish';
import start, { StartOptions } from './start';

import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';

const api = {
  'import': _import,
  init,
  install,
  lint,
  make,
  'package': _package,
  publish,
  start,
}

export {
  ForgeMakeResult,
  ImportOptions,
  InitOptions,
  InstallAsset,
  InstallOptions,
  LintOptions,
  MakeOptions,
  PackageOptions,
  PublishOptions,
  StartOptions,
  api,
};
