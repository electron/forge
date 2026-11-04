import fs from 'node:fs/promises';
import path from 'node:path';

import { ForgeArch, ForgeMakeResult } from '@electron-forge/shared-types';

export const RELEASES_FILE = 'RELEASES';

/**
 * A single asset to upload to a GitHub release.
 */
export interface UploadEntry {
  /** Path of the artifact on disk. */
  path: string;
  /** Asset name to upload the artifact under. */
  name: string;
  /**
   * In-memory body to upload instead of the file at `path`, when the uploaded
   * content differs from what the maker wrote to disk.
   */
  data?: Buffer;
}

// Matches a Squirrel.Windows RELEASES entry: `<SHA1> <file-or-url> <size>`,
// optionally followed by a `# NN%` staging percentage. The trailing group
// keeps any `\r` so CRLF line endings survive the rewrite.
const RELEASE_ENTRY = /^([0-9a-fA-F]{40}\s+)(\S+)(\s+\d+(?:\s+#\s*\d+%)?\s*)$/;

const isNupkg = (fileName: string): boolean =>
  fileName.toLowerCase().endsWith('.nupkg');

const isSquirrelWindowsResult = (result: ForgeMakeResult): boolean =>
  result.platform === 'win32' &&
  result.artifacts.some(
    (artifactPath) => path.basename(artifactPath) === RELEASES_FILE,
  );

/**
 * Whether the given make results contain Squirrel.Windows artifacts for more
 * than one architecture. GitHub only allows one asset per name on a release,
 * and electron-winstaller names `RELEASES` and the `.nupkg` files identically
 * for every arch, so in that case non-x64 assets need an arch prefix.
 */
export function hasMultipleSquirrelArches(results: ForgeMakeResult[]): boolean {
  const arches = new Set(
    results.filter(isSquirrelWindowsResult).map((result) => result.arch),
  );
  return arches.size > 1;
}

/**
 * Rewrites the `.nupkg` file names in the contents of a Squirrel.Windows
 * `RELEASES` file so that they carry a lowercase `{arch}.` prefix, matching
 * the asset names the packages are uploaded under. Line endings, blank lines,
 * comments and the SHA1 / size columns are left untouched, and names that are
 * already prefixed are not prefixed twice.
 */
export function rewriteReleasesForArch(
  contents: string,
  arch: ForgeArch,
): string {
  const prefix = `${arch}.`;
  return contents.replace(/^.*$/gm, (line) =>
    line.replace(
      RELEASE_ENTRY,
      (_match, sha: string, token: string, rest: string) => {
        // The file column may be an absolute URL, in which case only the last
        // path segment is the nupkg name.
        const slash = token.lastIndexOf('/');
        const dir = token.slice(0, slash + 1);
        const fileName = token.slice(slash + 1);
        if (!isNupkg(fileName) || fileName.startsWith(prefix)) {
          return `${sha}${token}${rest}`;
        }
        return `${sha}${dir}${prefix}${fileName}${rest}`;
      },
    ),
  );
}

/**
 * Builds the list of assets to upload for a single make result.
 *
 * When `prefixNonX64Squirrel` is set and the result is a non-x64
 * Squirrel.Windows build, its `RELEASES` file (with rewritten contents) and
 * `.nupkg` files are uploaded under `{arch}.`-prefixed names so that they do
 * not collide with the x64 assets. Everything else keeps its file name.
 */
export async function uploadEntriesForMakeResult(
  result: ForgeMakeResult,
  prefixNonX64Squirrel: boolean,
): Promise<UploadEntry[]> {
  const prefix =
    prefixNonX64Squirrel &&
    result.arch !== 'x64' &&
    isSquirrelWindowsResult(result)
      ? `${result.arch}.`
      : undefined;

  return Promise.all(
    result.artifacts.map(async (artifactPath): Promise<UploadEntry> => {
      const fileName = path.basename(artifactPath);
      if (prefix === undefined) {
        return { path: artifactPath, name: fileName };
      }
      if (fileName === RELEASES_FILE) {
        const contents = await fs.readFile(artifactPath, 'utf8');
        return {
          path: artifactPath,
          name: `${prefix}${fileName}`,
          data: Buffer.from(
            rewriteReleasesForArch(contents, result.arch),
            'utf8',
          ),
        };
      }
      if (isNupkg(fileName) && !fileName.startsWith(prefix)) {
        return { path: artifactPath, name: `${prefix}${fileName}` };
      }
      return { path: artifactPath, name: fileName };
    }),
  );
}
