import { PackagingOptions } from 'electron-windows-msix';

/**
 * The configuration object for the MSIX maker.
 * The `outputDir` parameter is preconfigured by Forge.
 *
 * @see https://github.com/bitdisaster/electron-windows-msix/blob/master/src/types.ts
 */
export type MakerMsixConfig = Omit<PackagingOptions, 'outputDir'>;
