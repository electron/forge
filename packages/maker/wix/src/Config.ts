import { MSICreator, MSICreatorOptions } from 'electron-wix-msi/lib/creator';

export type MakerWixConfig = Omit<MSICreatorOptions, 'appDirectory' | 'outputDirectory' | 'description' | 'name' | 'version' | 'manufacturer' | 'exe'> & {
  description?: string;
  name?: string;
  version?: string;
  manufacturer?: string;
  exe?: string;
  /**
   * Allows for the modification of the MSICreator before create is called.
   */
  beforeCreate?: (creator: MSICreator) => Promise<void> | void;
};
