import parseAuthor, { AuthorType } from 'parse-author';

export default function getNameFromAuthor(author: AuthorType) {
  let publisher = author || '';

  if (typeof publisher === 'string') {
    publisher = parseAuthor(publisher);
  }

  if (typeof publisher !== 'string' && typeof publisher.name === 'string') {
    publisher = publisher.name;
  }

  if (typeof publisher !== 'string') {
    publisher = '';
  }

  return publisher;
}
