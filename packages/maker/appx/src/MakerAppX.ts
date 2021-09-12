import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import fs from 'fs-extra';
import path from 'path';
import resolveCommand from 'cross-spawn/lib/util/resolveCommand';
import windowsStore from 'electron-windows-store';
import { isValidPublisherName, makeCert } from 'electron-windows-store/lib/sign';

import getNameFromAuthor from './util/author-name';
import { MakerAppXConfig } from './Config';

// NB: This is not a typo, we require AppXs to be built on 64-bit
// but if we're running in a 32-bit node.js process, we're going to
// be Wow64 redirected
const windowsSdkPaths = [
  'C:\\Program Files\\Windows Kits\\10\\bin\\x64',
  'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64',
];

async function findSdkTool(exe: string) {
  let sdkTool: string | undefined;
  for (const testPath of windowsSdkPaths) {
    if (await fs.pathExists(testPath)) {
      let testExe = path.resolve(testPath, exe);
      if (await fs.pathExists(testExe)) {
        sdkTool = testExe;
        break;
      }
      const topDir = path.dirname(testPath);
      for (const subVersion of await fs.readdir(topDir)) {
        if (!(await fs.stat(path.resolve(topDir, subVersion))).isDirectory()) continue; // eslint-disable-line max-len, no-continue
        if (subVersion.substr(0, 2) !== '10') continue; // eslint-disable-line no-continue

        testExe = path.resolve(topDir, subVersion, 'x64', 'makecert.exe');
        if (await fs.pathExists(testExe)) {
          sdkTool = testExe;
          break;
        }
      }
    }
  }
  if (!sdkTool || !await fs.pathExists(sdkTool)) {
    sdkTool = resolveCommand({ command: exe, options: { cwd: null } }, true);
  }

  if (!sdkTool || !await fs.pathExists(sdkTool)) {
    throw new Error(`Can't find ${exe} in PATH. You probably need to install the Windows SDK.`);
  }

  return sdkTool;
}

export interface CreateDefaultCertOpts {
  certFilePath?: string;
  certFileName?: string;
  program?: MakerAppXConfig;
  install?: boolean;
}

export async function createDefaultCertificate(publisherName: string, {
  certFilePath, certFileName, install, program,
}: CreateDefaultCertOpts): Promise<string> {
  const makeCertOptions = {
    publisherName,
    certFilePath: certFilePath || process.cwd(),
    certFileName: certFileName || 'default',
    install: typeof install === 'boolean' ? install : false,
    program: program || { windowsKit: path.dirname(await findSdkTool('makecert.exe')) },
  };

  if (!isValidPublisherName(publisherName)) {
    throw new Error(`Received invalid publisher name: '${publisherName}' did not conform to X.500 distinguished name syntax for MakeCert.`);
  }

  return makeCert(makeCertOptions);
}

export default class MakerAppX extends MakerBase<MakerAppXConfig> {
  name = 'appx';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
  }: MakerOptions): Promise<string[]> {
    const outPath = path.resolve(makeDir, `appx/${targetArch}`);
    await this.ensureDirectory(outPath);

    const opts = {
      publisher: `CN=${getNameFromAuthor(packageJSON.author)}`,
      flatten: false,
      deploy: false,
      packageVersion: `${packageJSON.version}.0`,
      packageName: packageJSON.name.replace(/-/g, ''),
      packageDisplayName: appName,
      packageDescription: packageJSON.description || appName,
      packageExecutable: `app\\${appName}.exe`,
      windowsKit: this.config.windowsKit || path.dirname(await findSdkTool('makeappx.exe')),
      ...this.config,
      inputDirectory: dir,
      outputDirectory: outPath,
    };

    if (!opts.publisher) {
      throw new Error(
        'Please set config.forge.windowsStoreConfig.publisher or author.name in package.json for the appx target',
      );
    }

    if (!opts.devCert) {
      opts.devCert = await createDefaultCertificate(
        opts.publisher,
        { certFilePath: outPath, program: opts },
      );
    }

    if (opts.packageVersion.includes('-')) {
      if (opts.makeVersionWinStoreCompatible) {
        opts.packageVersion = this.normalizeWindowsVersion(opts.packageVersion);
      } else {
        throw new Error(
          "Windows Store version numbers don't support semver beta tags. To "
          + 'automatically fix this, set makeVersionWinStoreCompatible to true or '
          + 'explicitly set packageVersion to a version of the format X.Y.Z.A',
        );
      }
    }

    delete opts.makeVersionWinStoreCompatible;

    await windowsStore(opts);

    return [path.resolve(outPath, `${opts.packageName}.appx`)];
  }
}
