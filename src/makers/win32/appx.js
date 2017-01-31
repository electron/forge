import windowsStore from 'electron-windows-store';
import fs from 'fs';
import path from 'path';
import { spawnPromise, findActualExecutable } from 'spawn-rx';

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
    throw new Error(`Can't find ${exe} in PATH, you probably need to install the Windows SDK`);
  }

  return sdkTool;
}

function spawnSdkTool(exe, params) {
  return spawnPromise(findSdkTool(exe), params);
}

export async function createDefaultCertificate(publisherName, outPath) {
  const defaultPvk = path.resolve(__dirname, '..', '..', '..', 'res', 'default.pvk');
  const targetCert = path.join(outPath, 'default.cer');
  const targetPfx = path.join(outPath, 'default.pfx');

  await spawnSdkTool(
    'makecert.exe',
    ['-r', '-h', '0', '-n', `CN=${publisherName}`, '-eku', '1.3.6.1.5.5.7.3.3', '-pe', '-sv', defaultPvk, targetCert]);

  await spawnSdkTool('pvk2pfx.exe', ['-pvk', defaultPvk, '-spc', targetCert, '-pfx', targetPfx]);

  return targetPfx;
}

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, `../make/appx/${targetArch}`);
  await ensureDirectory(outPath);

  const opts = Object.assign({
    publisher: packageJSON.author,
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

  if (!opts.devCert) {
    opts.devCert = await createDefaultCertificate(opts.publisher, outPath);
  }

  if (!opts.publisher.match(/^CN=/)) {
    opts.publisher = `CN=${opts.publisher}`;
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
