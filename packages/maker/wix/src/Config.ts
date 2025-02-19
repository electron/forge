import { MSICreator, MSICreatorOptions } from 'electron-wix-msi/lib/creator';

export type MakerWixConfig = Omit<MSICreatorOptions, 'appDirectory' | 'outputDirectory' | 'description' | 'name' | 'version' | 'manufacturer' | 'exe'> & {
  /**
   * The app's description
   *
   * @defaultValue The `description` field in package.json
   */
  description?: string;
  /**
   * The app's name.
   *
   * @defaultValue The value of `packagerConfig.name` in the Forge config, or the `productName` or `name` in package.json (in that order)
   */
  name?: string;
  /**
   * The app's version
   *
   * @defaultValue The `version` field in package.json
   */
  version?: string;
  /**
   * The app's manufacturer
   *
   * @defaultValue The `author` field in package.json
   */
  manufacturer?: string;
  /**
   * The name of the exe file
   *
   * @defaultValue the default {@link MakerWixConfig.name} + `.exe`
   */
  exe?: string;
  /**
   * Allows for the modification of the MSICreator before create is called.
   */
  beforeCreate?: (creator: MSICreator) => Promise<void> | void;
};
