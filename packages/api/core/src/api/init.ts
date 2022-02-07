import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import { ForgeTemplate } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import findTemplate from './init-scripts/find-template';
import initDirectory from './init-scripts/init-directory';
import initGit from './init-scripts/init-git';
import initNPM from './init-scripts/init-npm';
import installDepList, { DepType } from '../util/install-dependencies';
import { readRawPackageJson } from '../util/read-package-json';
import { setInitialForgeConfig } from '../util/forge-config';

const d = debug('electron-forge:init');

export interface InitOptions {
  /**
   * The path to the app to be initialized
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to copy Travis and AppVeyor CI files
   */
  copyCIFiles?: boolean;
  /**
   * Whether to overwrite an existing directory
   */
  force?: boolean;
  /**
   * The custom template to use. If left empty, the default template is used
   */
  template?: string;
}

async function validateTemplate(template: string, templateModule: ForgeTemplate): Promise<void> {
  if (!templateModule.requiredForgeVersion) {
    throw new Error(`Cannot use a template (${template}) with this version of Electron Forge, as it does not specify its required Forge version.`);
  }

  const forgeVersion = (await readRawPackageJson(path.join(__dirname, '..', '..'))).version;
  if (!semver.satisfies(forgeVersion, templateModule.requiredForgeVersion)) {
    throw new Error(
      `Template (${template}) is not compatible with this version of Electron Forge (${forgeVersion}), it requires ${templateModule.requiredForgeVersion}`
    );
  }
}

export default async ({ dir = process.cwd(), interactive = false, copyCIFiles = false, force = false, template = 'base' }: InitOptions): Promise<void> => {
  asyncOra.interactive = interactive;

  d(`Initializing in: ${dir}`);

  await initDirectory(dir, force);
  await initGit(dir);
  const templateModule = await findTemplate(dir, template);

  await validateTemplate(template, templateModule);

  if (typeof templateModule.initializeTemplate === 'function') {
    await templateModule.initializeTemplate(dir, { copyCIFiles });
    const packageJSON = await readRawPackageJson(dir);
    setInitialForgeConfig(packageJSON);
    await fs.writeJson(path.join(dir, 'package.json'), packageJSON, { spaces: 2 });
  }

  await asyncOra('Installing Template Dependencies', async () => {
    d('installing dependencies');
    await installDepList(dir, templateModule.dependencies || []);
    d('installing devDependencies');
    await installDepList(dir, templateModule.devDependencies || [], DepType.DEV);
  });

  await initNPM(dir);
};
