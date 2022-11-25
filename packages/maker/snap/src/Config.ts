import { Options as InstallerSnapOptions, SnapcraftConfig } from 'electron-installer-snap';

export { SnapcraftConfig, InstallerSnapOptions };

export type MakerSnapConfig = Omit<InstallerSnapOptions, 'arch' | 'dest' | 'src'> & SnapcraftConfig;
