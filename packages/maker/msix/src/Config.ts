import {
  ManifestGenerationVariables,
  PackagingOptions as MSIXPackagingOptions,
} from 'electron-windows-msix';

type SemiPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * The configuration object for the MSIX maker.
 * The `outputDir` and `appDir` parameters are preconfigured by Forge so that the
 * Maker uses the package output and can be then used to publish the app.
 *
 * Certain manifest variables are given good defaults by Forge. You can override these
 * if required.
 *
 * @see https://github.com/bitdisaster/electron-windows-msix/blob/master/src/types.ts
 */
export type MakerMSIXConfig = Omit<
  MSIXPackagingOptions,
  'outputDir' | 'appDir' | 'manifestVariables'
> & {
  manifestVariables?: SemiPartial<
    ManifestGenerationVariables,
    | 'packageDescription'
    | 'appExecutable'
    | 'packageVersion'
    | 'publisher'
    | 'packageIdentity'
    | 'targetArch'
  >;
};
