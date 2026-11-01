export interface IconsPluginConfig {
  /**
   * Path to a square PNG, relative to the project directory. 1024×1024 pixels
   * or larger is recommended; smaller sources are upscaled with a warning.
   */
  source: string;
  /**
   * Where to write the generated icons, relative to the project directory.
   *
   * @defaultValue `<outDir>/icons`
   */
  outDir?: string;
  /**
   * Pixel size of the Linux `icon.png`.
   *
   * @defaultValue 512
   */
  linuxSize?: number;
}
