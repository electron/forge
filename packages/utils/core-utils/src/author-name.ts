import { PackagePerson } from '@electron-forge/shared-types';

type ParsedAuthor = { name?: string; email?: string; url?: string };

/*!
 * Inlined from parse-author <https://github.com/jonschlinkert/parse-author>
 * and author-regex <https://github.com/jonschlinkert/author-regex>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
function authorRegex(): RegExp {
  return /^\s*([^<(]*?)\s*([<(]([^>)]*?)[>)])?\s*([<(]([^>)]*?)[>)])*\s*$/;
}

export function parseAuthor(str: string): ParsedAuthor {
  if (typeof str !== 'string') {
    throw new TypeError('expected author to be a string');
  }

  if (!str || !/\w/.test(str)) {
    return {};
  }

  const match = ([] as unknown[]).concat.apply([], authorRegex().exec(str)!);
  const author: ParsedAuthor = {};

  if (match[1]) {
    author.name = match[1] as string;
  }

  for (let i = 2; i < match.length; i++) {
    const val = match[i] as string | undefined;

    if (i % 2 === 0 && val && match[i + 1]) {
      if (val.charAt(0) === '<') {
        author.email = match[i + 1] as string;
        i++;
      } else if (val.charAt(0) === '(') {
        author.url = match[i + 1] as string;
        i++;
      }
    }
  }
  return author;
}

/**
 * Extracts the name from a package.json author field.
 *
 * @param author - The author field to extract the name from.
 * @returns The name of the author.
 *
 * @see https://docs.npmjs.com/cli/configuring-npm/package-json#people-fields-author-contributors
 */
export function getNameFromAuthor(author: PackagePerson): string {
  const parsed = typeof author === 'string' ? parseAuthor(author) : author;
  return parsed?.name ?? '';
}
