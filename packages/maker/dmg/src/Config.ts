export interface MakerDMGConfig {
  /**
   * The application name
   */
  name?: string;
  /**
   * Path to the background for the DMG window
   */
  background?: string;
  /**
   * Path to the icon to use for the app in the DMG window
   */
  icon?: string;
  /**
   * Overwrite an existing DMG file if if already exists
   */
  overwrite?: boolean;
  /**
   * Enable debug message output
   */
  debug?: boolean;
  /**
   * How big to make the icon for the app in the DMG
   */
  'icon-size'?: number;
  /**
   * Disk image format
   */
  format?: 'UDRW' | 'UDRO' | 'UDCO' | 'UDZO' | 'UDBZ' | 'ULFO';
}