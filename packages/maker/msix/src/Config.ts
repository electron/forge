import { PackagingOptions } from 'electron-windows-msix';

export type MakerMsixConfig = Omit<PackagingOptions, 'outputDir'>;
