import MakerBase from '@electron-forge/maker-base';

import fs from 'fs-extra';
import path from 'path';
import resolveCommand from 'cross-spawn/lib/util/resolveCommand';
import windowsStore from 'electron-windows-store';
import { isValidPublisherName, makeCert } from 'electron-windows-store/lib/sign';

import getNameFromAuthor from './util/author-name';

// NB: This is not a typo, we require AppXs to be built on 64-bit
// but if we're running in a 32-bit node.js process, we're going to
// be Wow64 redirected
const windowsSdkPath = process.arch === 'x64' ?
  'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64' :
  'C:\\Program Files\\Windows Kits\\10\\bin\\x64';

async function findSdkTool(exe) {
  let sdkTool = path.join(windowsSdkPath, exe);
  if (!await fs.exists(sdkTool)) {
    sdkTool = resolveCommand(exe, true);
  }

  if (!await fs.exists(sdkTool)) {
    throw `Can't find ${exe} in PATH. You probably need to install the Windows SDK.`;
  }

  return sdkTool;
}

export async function createDefaultCertificate(publisherName, { certFilePath, certFileName, install, program }) {
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

  return await makeCert(makeCertOptions);
}

export default class MakerAppX extends MakerBase {
  name = 'appx';

  isSupportedOnCurrentPlatform() {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetArch,
  }) {
    const outPath = path.resolve(makeDir, `appx/${targetArch}`);
    await this.ensureDirectory(outPath);

    const opts = Object.assign({
      publisher: `CN=${getNameFromAuthor(packageJSON.author)}`,
      flatten: false,
      deploy: false,
      packageVersion: `${packageJSON.version}.0`,
      packageName: packageJSON.name.replace(/-/g, ''),
      packageDisplayName: appName,
      packageDescription: packageJSON.description || appName,
      packageExecutable: `app\\${appName}.exe`,
      windowsKit: this.config.windowsKit || path.dirname(await findSdkTool('makeappx.exe')),
    }, this.config, {
      inputDirectory: dir,
      outputDirectory: outPath,
    });

    if (!opts.publisher) {
      throw 'Please set config.forge.windowsStoreConfig.publisher or author.name in package.json for the appx target';
    }

    if (!opts.devCert) {
      opts.devCert = await createDefaultCertificate(opts.publisher, { certFilePath: outPath, program: opts });
    }

    if (opts.packageVersion.match(/-/)) {
      if (opts.makeVersionWinStoreCompatible) {
        const noBeta = opts.packageVersion.replace(/-.*/, '');
        opts.packageVersion = `${noBeta}.0`;
      } else {
        throw 'Windows Store version numbers don\'t support semver beta tags. To' +
          'automatically fix this, set makeVersionWinStoreCompatible to true or ' +
          'explicitly set packageVersion to a version of the format X.Y.Z.A';
      }
    }

    delete opts.makeVersionWinStoreCompatible;

    await windowsStore(opts);

    return [path.resolve(outPath, `${opts.packageName}.appx`)];
  }
}
