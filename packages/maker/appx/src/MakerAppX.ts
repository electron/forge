import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { styleText } from 'node:util';

import { getNameFromAuthor, move } from '@electron-forge/core-utils';
import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { toMsixArch } from '@electron-forge/maker-msix';
import { ForgePlatform } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';

import { MakerAppXConfig } from './Config.js';

/**
 * `electron-windows-store` options that have no `electron-windows-msix`
 * equivalent. They are ignored with a warning.
 */
const UNSUPPORTED_OPTIONS = [
  'containerVirtualization',
  'createConfigParams',
  'createPriParams',
  'deploy',
  'desktopConverter',
  'expandedBaseImage',
  'finalSay',
  'flatten',
  'makeappxParams',
] as const satisfies readonly (keyof MakerAppXConfig)[];

// Ported from electron-windows-store/lib/sign.js: the subset of RFC 1779 /
// X.500 distinguished names that MakeCert accepted (no comma/space escaping).
const validDNRegex = (() => {
  const validKeyPattern = [
    'CN',
    'OU',
    'O',
    'STREET',
    'L',
    'ST',
    'C',
    'DC',
    'SN',
    'GN',
    'E',
    'S',
    'T',
    'G',
    'I',
    'SERIALNUMBER',
    '(?:OID\\.(0|[1-9][0-9]*)(?:\\.(0|[1-9][0-9]*))+)',
  ].join('|');
  const doubleQuotedValue = '"[^"\\\\]*(?:[^"][^"\\\\]*)*"';
  const keyValuePair = `(${validKeyPattern})=((?:${doubleQuotedValue})|[^,"]*)`;
  return new RegExp(`^${keyValuePair}(?:\\s*[,;]\\s*${keyValuePair})*,?$`, 'i');
})();

/**
 * Builds a Microsoft Store package from a legacy `@electron-forge/maker-appx`
 * configuration using the MSIX tooling (`electron-windows-msix`).
 *
 * @deprecated Use `@electron-forge/maker-msix` instead. This maker is a
 * compatibility layer over the MSIX packaging code path: it maps
 * {@link MakerAppXConfig} onto `electron-windows-msix` options and writes a
 * `.msix` (not `.appx`) file to `make/appx/<arch>/`. Options without an MSIX
 * equivalent are ignored with a warning, and the maker no longer creates a
 * development certificate itself: when `devCert` is not set, signing is left
 * to `electron-windows-msix`, which generates a throwaway self-signed
 * certificate.
 */
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
    for (const option of UNSUPPORTED_OPTIONS) {
      if (this.config[option] !== undefined) {
        console.warn(
          styleText('yellow', '⚠'),
          styleText(
            'yellow',
            `WARNING: The "${option}" option is not supported by @electron-forge/maker-appx anymore and will be ignored. ` +
              'Migrate to @electron-forge/maker-msix.',
          ),
        );
      }
    }

    const authorName = getNameFromAuthor(packageJSON.author);
    const publisher =
      this.config.publisher ?? (authorName && `CN=${authorName}`);
    if (!publisher) {
      throw new Error(
        'Please set the "publisher" option in the maker config or "author.name" in package.json for the appx target',
      );
    }
    if (!validDNRegex.test(publisher)) {
      throw new Error(
        `Received invalid publisher name: '${publisher}' did not conform to X.500 distinguished name syntax.`,
      );
    }

    let packageVersion =
      this.config.packageVersion ?? `${packageJSON.version}.0`;
    if (/[-+]/.test(packageVersion)) {
      if (this.config.makeVersionWinStoreCompatible) {
        packageVersion = this.normalizeWindowsVersion(packageVersion);
      } else {
        throw new Error(
          "Windows Store version numbers don't support semver beta tags. To " +
            'automatically fix this, set makeVersionWinStoreCompatible to true or ' +
            'explicitly set packageVersion to a version of the format X.Y.Z.A',
        );
      }
    }

    const packageName =
      this.config.packageName ?? packageJSON.name.replace(/-/g, '');

    // Do all the scratch work in a temporary folder
    const tmpFolder = await fs.mkdtemp(
      path.resolve(os.tmpdir(), 'appx-maker-'),
    );

    try {
      const result = await packageMSIX({
        appDir: dir,
        outputDir: tmpFolder,
        packageName: `${packageName}.msix`,
        appManifest: this.config.manifest,
        packageAssets: this.config.assets,
        windowsKitPath: this.config.windowsKit,
        createPri: this.config.makePri ?? false,
        windowsSignOptions: this.config.devCert
          ? {
              certificateFile: this.config.devCert,
              certificatePassword: this.config.certPass,
              signWithParams: this.config.signtoolParams,
            }
          : undefined,
        manifestVariables: {
          packageIdentity: packageName,
          publisher,
          packageVersion,
          packageDisplayName: this.config.packageDisplayName ?? appName,
          packageDescription:
            this.config.packageDescription ??
            (packageJSON.description || appName),
          packageBackgroundColor: this.config.packageBackgroundColor,
          // electron-windows-store took the executable relative to the package
          // root (`app\\Name.exe`); electron-windows-msix prepends `app\\` itself.
          appExecutable:
            this.config.packageExecutable?.replace(/^app[\\/]/, '') ??
            `${appName}.exe`,
          targetArch: toMsixArch(targetArch),
        },
      });

      const outputPath = path.resolve(
        makeDir,
        'appx',
        targetArch,
        `${packageName}.msix`,
      );
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await move(result.msixPackage, outputPath);
      return [outputPath];
    } finally {
      await fs.rm(tmpFolder, { recursive: true, force: true });
    }
  }
}

export { MakerAppX, MakerAppXConfig };
