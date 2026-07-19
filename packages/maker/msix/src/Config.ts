import {
  ManifestGenerationVariables,
  PackagingOptions as MSIXPackagingOptions,
} from 'electron-windows-msix';

/** @inline */
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
export interface MakerMSIXConfig extends Omit<
  MSIXPackagingOptions,
  'outputDir' | 'appDir' | 'manifestVariables'
> {
  manifestVariables?: SemiPartial<
    ManifestGenerationVariables,
    | 'packageDescription'
    | 'appExecutable'
    | 'packageVersion'
    | 'publisher'
    | 'packageIdentity'
    | 'targetArch'
  >;
  /**
   * The base name of the generated `.msix` file, without the `.msix`
   * extension (the maker always appends `.msix`). This only overrides the
   * file name; the file is still written to the same `msix/<arch>` output
   * directory.
   *
   * This can be a string, or a (possibly async) function returning the base
   * filename. The function form is useful when you want to compute the value
   * dynamically, e.g. to include a version number.
   *
   * @defaultValue `${path.basename(dir)}-${packageJSON.version}`, e.g.
   * `my-app-win32-x64-1.2.3`
   */
  outputFileName?: string | (() => string | Promise<string>);
}
