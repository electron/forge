import { Options, SnapcraftConfig } from 'electron-installer-snap';

export type MakerSnapConfig = Omit<Options, 'arch' | 'dest' | 'src'> & SnapcraftConfig;
