import { Options, SnapcraftConfig } from 'electron-installer-snap';

// eslint-disable-next-line import/prefer-default-export
export type MakerSnapConfig = Omit<Options, 'arch' | 'dest' | 'src'> & SnapcraftConfig;
