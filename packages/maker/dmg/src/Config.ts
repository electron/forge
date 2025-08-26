import type { ElectronInstallerDMGOptions } from 'electron-installer-dmg';

export interface CodeSignOptions {
  'signing-identity': string;
  identifier?: string;
}

export interface DMGContents {
  x: number;
  y: number;
  type: 'link' | 'file' | 'position';
  path: string;
  name?: string;
}

export interface WindowPositionOptions {
  x: number;
  y: number;
}

export interface WindowSizeOptions {
  width: number;
  height: number;
}

export interface WindowOptions {
  position?: WindowPositionOptions;
  size?: WindowSizeOptions;
}

export interface AdditionalDMGOptions {
  'background-color'?: string;
  'icon-size'?: number;
  window?: WindowOptions;
  'code-sign'?: CodeSignOptions;
}

export type MakerDMGConfig = Omit<
  ElectronInstallerDMGOptions,
  'name' | 'appPath' | 'out'
> & { name?: string };
