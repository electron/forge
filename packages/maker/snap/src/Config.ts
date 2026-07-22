import { Options, SnapcraftConfig } from 'electron-installer-snap';

export interface MakerSnapConfig
  extends Omit<Options, 'arch' | 'dest' | 'src'>, SnapcraftConfig {}
