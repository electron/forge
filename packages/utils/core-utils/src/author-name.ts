import { PackagePerson } from '@electron-forge/shared-types';
import parseAuthor from 'parse-author';

/**
 * Extracts the name from a package.json author field.
 *
 * @param author - The author object to extract the name from.
 * @returns The name of the author.
 *
 * @see https://docs.npmjs.com/cli/configuring-npm/package-json#people-fields-author-contributors
 */
export function getNameFromAuthor(author: PackagePerson): string {
  let publisher: PackagePerson = author || '';

  if (typeof publisher === 'string') {
    publisher = parseAuthor(publisher);
  }

  if (
    typeof publisher !== 'string' &&
    publisher &&
    typeof publisher.name === 'string'
  ) {
    publisher = publisher.name;
  }

  if (typeof publisher !== 'string') {
    publisher = '';
  }

  return publisher;
}
