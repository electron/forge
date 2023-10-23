import filenamify from 'filenamify';

/**
 * Returns a name safe to be used as a directory. This
 * boils down to filenamify but with spaces replaced, too.
 *
 * @param input
 * @returns {string}
 */
export default function getSafeDirName(input: string): string {
  return filenamify(input, { replacement: '-' }).replace(/ /g, '-');
}
