import parseAuthor from 'parse-author';

type AuthorType = string | {
  name: string;
} | undefined;

export default function getNameFromAuthor(author: AuthorType) {
  let publisher: AuthorType = author || '';

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
