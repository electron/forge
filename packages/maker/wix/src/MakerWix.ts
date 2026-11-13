import path from 'node:path';
import { styleText } from 'node:util';

import { getNameFromAuthor } from '@electron-forge/core-utils';
import { MakerBase, type MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { MSICreator } from 'electron-wix-msi';
import semver from 'semver';

import { MakerWixConfig } from './Config.js';

function isValidWixArch(
  arch: string,
): arch is 'x64' | 'ia64' | 'x86' | 'arm64' {
  // arm64 is not officially supported by electron-wix-msi
  // But it is supported by WiX toolset v3.14 and later
  // And it does not break in electron-wix-msi
  // Ref: https://github.com/electron-userland/electron-wix-msi/issues/150
  return ['x64', 'ia64', 'x86', 'arm64'].includes(arch);
}

export default class MakerWix extends MakerBase<MakerWixConfig> {
  name = 'wix';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
  }: MakerOptions): Promise<string[]> {
    const outPath = path.resolve(makeDir, `wix/${targetArch}`);
    await this.ensureDirectory(outPath);

    const { version } = packageJSON;
    const parsed = semver.parse(version);
    if (
      (Array.isArray(parsed?.prerelease) && parsed.prerelease.length > 0) ||
      (Array.isArray(parsed?.build) && parsed.build.length > 0)
    ) {
      console.warn(
        styleText('yellow', '⚠'),
        styleText(
          'yellow',
          'WARNING: MSI packages follow Windows version format "major.minor.build.revision".\n' +
            `The provided semantic version "${version}" will be transformed to Windows version format. Prerelease component will not be retained.`,
        ),
      );
    }

    if (!isValidWixArch(targetArch)) {
      throw new Error(`Invalid arch: ${targetArch}`);
    }

    const creator = new MSICreator({
      description: packageJSON.description,
      name: appName,
      version,
      manufacturer: getNameFromAuthor(packageJSON.author),
      exe: `${appName}.exe`,
      arch: targetArch,
      ...this.config,
      appDirectory: dir,
      outputDirectory: outPath,
    });

    if (this.config.beforeCreate) {
      await Promise.resolve(this.config.beforeCreate(creator));
    }
    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

export { MakerWix, MakerWixConfig };
