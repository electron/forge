export type ChecksumAlgorithm = 'sha256' | 'sha512';

export interface ChecksumsPluginConfig {
  /**
   * Hash algorithm used for the checksum file.
   *
   * @defaultValue 'sha256'
   */
  algorithm?: ChecksumAlgorithm;
  /**
   * Generate a CycloneDX 1.5 software bill of materials (SBOM) for each
   * platform and arch, listing the npm packages shipped inside the app.
   *
   * Packages that a bundler (Vite, webpack) inlined into your bundles are not
   * in the packaged `node_modules` folder and are not listed.
   *
   * @defaultValue true
   */
  sbom?: boolean;
}
