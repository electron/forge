declare module '@electron-forge/shared-types' {
  export type ForgePlatform = 'darwin' | 'mas' | 'win32' | 'linux';
  export type ForgeArch = 'ia32' | 'x64' | 'armv7l' | 'arm'; 
  export interface ForgeConfig {

  }
  export interface ForgeMakeResult {
    /**
     * An array of paths to artifacts generated for this make run
     */
    artifacts: Array<string>;
    /**
     * The state of the package.json file when the make happened
     */
    packageJSON: any;
    /**
     * The platform this make run was for
     */
    platform: ForgePlatform;
    /**
     * The arch this make run was for
     */
    arch: ForgePlatform;
  }
}
