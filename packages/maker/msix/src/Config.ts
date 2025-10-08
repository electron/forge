import { PackagingOptions } from 'electron-windows-msix';

/**
 * The configuration object for the MSIX maker.
 * The `outputDir` and `appDir` parameters are preconfigured by Forge so that the
 * Maker uses the package output and can be then used to publish the app.
 *
 * @see https://github.com/bitdisaster/electron-windows-msix/blob/master/src/types.ts
 */
export type MakerMsixConfig = Omit<PackagingOptions, 'outputDir' | 'appDir'>;
