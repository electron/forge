export interface MakerZIPDeltaConfig {
  /**
   * Path to a Sparkle `BinaryDelta` executable to use instead of the one this
   * maker downloads. It must create format 3 or 4 patches (Sparkle 2.x);
   * this maker always asks for format 4 with LZMA compression.
   *
   * By default, the maker downloads the Sparkle 2.9.5 release from GitHub,
   * verifies its checksum, and caches `bin/BinaryDelta` in
   * `~/Library/Caches/electron-forge/`.
   */
  binaryDeltaPath?: string;
  /**
   * Fail the make if the delta cannot be created. By default, the maker
   * logs a warning and publishes the release without a delta, which
   * Squirrel.Mac then installs from the full ZIP.
   */
  strict?: boolean;
}

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
   * Each new entry also records the `sha256` and `size` of the ZIP, which
   * Squirrel.Mac verifies before installing the update (Electron versions
   * without that check ignore the extra keys).
   *
   * If this option is not set no RELEASES.json file will be generated.
   */
  macUpdateManifestBaseUrl?: string;
  /**
   * Only used if `macUpdateManifestBaseUrl` is provided. Used to populate
   * the "notes" field of the releases manifest for macOS updates.
   */
  macUpdateReleaseNotes?: string;
  /**
   * Only used if `macUpdateManifestBaseUrl` is provided, and only when
   * making for `darwin` on a macOS host (other hosts log a warning and
   * skip it). Pass `true` or an object with options to also create a
   * binary delta from the previous release to this one, and offer it in
   * the `delta` field of the new release's `updateTo` entry.
   *
   * Squirrel.Mac downloads the delta instead of the full ZIP when the
   * running app's `CFBundleVersion` (packager's `buildVersion`, which
   * defaults to the app version) matches the delta's `from_version`. It
   * checks the delta's size and SHA-256, applies it to a copy of the
   * running app and verifies the code signature of the result. If any step
   * fails, it falls back to the full ZIP in the same update check. Electron
   * versions without delta support (electron/electron#52820) ignore the
   * `delta` field.
   *
   * The maker creates the delta as follows:
   *
   * 1. It takes the `currentRelease` entry of the existing RELEASES.json,
   *    downloads that release's ZIP, verifies it against its `sha256` and
   *    `size` if recorded, and extracts it. It skips the delta if there is
   *    no previous release, or if the previous release is the version being
   *    made.
   * 2. It reads `CFBundleVersion` from the previous app's `Info.plist` and
   *    uses it as the delta's `from_version`.
   * 3. It runs Sparkle's `BinaryDelta create` on the previous and new app,
   *    then checks the result by applying the delta to a copy of the
   *    previous app and running `codesign --verify --deep --strict` on it.
   * 4. It writes `<name>-<previousVersion>-to-<version>.delta` next to the
   *    ZIP and returns it as an artifact, so publishers upload it beside
   *    the ZIP.
   *
   * Limitations:
   *
   * - A delta only applies to an app that is byte-for-byte identical to the
   *   one it was created from, including file modes. Squirrel.Mac clears
   *   group and other write permission when it installs an update, so if
   *   any file in your app is group- or other-writable when it is signed,
   *   installed apps will never match and deltas will fail after the first
   *   update. This maker runs after signing, so it can only detect that:
   *   it refuses to create a delta if either app has such files. Remove
   *   those permissions before signing: in a `packageAfterCopy` hook, run
   *   `chmod -R go-w` on the whole bundle (`path.resolve(buildPath,
   *   '../../..')`, as `buildPath` is the bundle's `Contents/Resources/app`
   *   directory), and build with a umask of `022` (the macOS default) so
   *   files created later, such as `app.asar`, are not group-writable
   *   either. Extra resources and icons are copied after that hook with
   *   their modes intact, so their source files must not be group-writable.
   * - The delta is created from the previous release as it was published,
   *   so the previous ZIP must contain the exact signed (and stapled) app
   *   that users installed.
   * - A static RELEASES.json can only offer one delta: from the release
   *   immediately before this one. Users on older releases download the
   *   full ZIP.
   * - Files outside `app.asar` whose names contain non-ASCII characters can
   *   fail signature verification after patching, which costs a fallback to
   *   the full ZIP.
   */
  macUpdateDelta?: boolean | MakerZIPDeltaConfig;
}
