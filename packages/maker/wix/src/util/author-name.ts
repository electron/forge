import { PackagePerson } from '@electron-forge/shared-types';
import parseAuthor from 'parse-author';

export default function getNameFromAuthor(author: PackagePerson): string {
  let publisher: PackagePerson = author || '';

  if (typeof publisher === 'string') {
    publisher = parseAuthor(publisher);
  }

  if (typeof publisher !== 'string' && publisher && typeof publisher.name === 'string') {
    publisher = publisher.name;
  }

  if (typeof publisher !== 'string') {
    publisher = '';
  }

  return publisher;
}
