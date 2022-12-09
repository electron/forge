export interface MakerZIPConfig {
  /**
   * A URL to the directory containing your existing macOS auto-update
   * RELEASES.json file.  If given this maker will download the existing
   * file and add this release to it, also setting the "currentRelease" to
   * this release.
   *
   * For instance if your URL is "https://update.example.com/my-app/darwin/x64/RELEASES.json"
   * you should provide "https://update.example.com/my-app/darwin/x64".  This logic assumes
   * that you published your files using a forge publisher compatible with the auto updater (e.g. S3).
   *
   * Publishing this RELEASES.json will result in clients downloading this version
   * as an update.
   *
   * If this option is not set no RELEASES.json file will be generated.
   */
  macUpdateManifestBaseUrl?: string;
  /**
   * Only used if `squirrelMacManifestBaseUrl` is provided. Used to populate
   * the "notes" field of the releases manifest for macOS updates.
   */
  macUpdateReleaseNotes?: string;
}
