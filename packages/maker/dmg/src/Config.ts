import type { ElectronInstallerDMGOptions } from 'electron-installer-dmg';

export interface MakerDMGConfig extends Omit<
  ElectronInstallerDMGOptions,
  'name' | 'appPath' | 'out'
> {
  name?: string;
}
