import type { ElectronInstallerDMGOptions } from 'electron-installer-dmg';

export type MakerDMGConfig = Omit<
  ElectronInstallerDMGOptions,
  'name' | 'appPath' | 'out'
> & { name?: string };
