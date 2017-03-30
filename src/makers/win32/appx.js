import fs from 'fs';
import path from 'path';
import parseAuthor from 'parse-author';
import windowsStore from 'electron-windows-store';
import { isValidPublisherName, makeCert } from 'electron-windows-store/lib/sign.js';

import { findActualExecutable } from 'spawn-rx';
import { ensureDirectory } from '../../util/ensure-output';

// NB: This is not a typo, we require AppXs to be built on 64-bit
// but if we're running in a 32-bit node.js process, we're going to
// be Wow64 redirected
const windowsSdkPath = process.arch === 'x64' ?
  'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64' :
  'C:\\Program Files\\Windows Kits\\10\\bin\\x64';

function findSdkTool(exe) {
  let sdkTool = path.join(windowsSdkPath, exe);
  if (!fs.existsSync(sdkTool)) {
    sdkTool = findActualExecutable(exe, []).cmd;
  }

  if (!fs.existsSync(sdkTool)) {
    throw new Error(`Can't find ${exe} in PATH. You probably need to install the Windows SDK.`);
  }

  return sdkTool;
}

export async function createDefaultCertificate(publisherName, { certFilePath, certFileName, install, program }) {
  const makeCertOptions = {
    publisherName,
    certFilePath: certFilePath || process.cwd(),
    certFileName: certFileName || 'default',
    install: typeof install === 'boolean' ? install : false,
    program: program || { windowsKit: path.dirname(findSdkTool('makecert.exe')) },
  };

  if (!isValidPublisherName(publisherName)) {
    throw new Error(`Received invalid publisher name: '${publisherName}' did not conform to X.500 distinguished name syntax for MakeCert.`);
  }

  return await makeCert(makeCertOptions);
}

export function getDistinguishedNameFromAuthor(author) {
  let publisher = author || '';

  if (typeof publisher === 'string') {
    publisher = parseAuthor(publisher);
  }

  if (typeof publisher.name === 'string') {
    publisher = publisher.name;
  }

  if (typeof publisher !== 'string') {
    publisher = '';
  }

  return `CN=${publisher}`;
}

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => {
  const outPath = path.resolve(dir, `../make/appx/${targetArch}`);
  await ensureDirectory(outPath);

  const opts = Object.assign({
    publisher: getDistinguishedNameFromAuthor(packageJSON.author),
    flatten: false,
    deploy: false,
    packageVersion: `${packageJSON.version}.0`,
    packageName: appName.replace(/-/g, ''),
    packageDisplayName: appName,
    packageDescription: packageJSON.description || appName,
    packageExecutable: `app\\${appName}.exe`,
    windowsKit: path.dirname(findSdkTool('makeappx.exe')),
  }, forgeConfig.windowsStoreConfig, {
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
      const err = "Windows Store version numbers don't support semver beta tags. To" +
        'automatically fix this, set makeVersionWinStoreCompatible to true or ' +
        'explicitly set packageVersion to a version of the format X.Y.Z.A';

      throw new Error(err);
    }
  }

  delete opts.makeVersionWinStoreCompatible;

  await windowsStore(opts);
};
