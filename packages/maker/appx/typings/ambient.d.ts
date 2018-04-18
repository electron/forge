declare module 'parse-author' {
  export type AuthorType = string | {
    name: string
  };
  interface ParseAuthor {
    (author: AuthorType): AuthorType;
  }
  const parseAuthor: ParseAuthor;
  export default parseAuthor;
}