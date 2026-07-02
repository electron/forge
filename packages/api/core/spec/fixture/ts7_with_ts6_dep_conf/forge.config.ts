// This fixture's `node_modules/typescript` is a TypeScript 7-shaped stub,
// but `@typescript/typescript6` (re-exporting a classic-API TypeScript) is
// installed side-by-side — the loader must pick it up transparently and
// still transpile this file.
const identifierParts: string[] = ['ts7', 'with', 'ts6', 'fallback'];

const config = {
  buildIdentifier: identifierParts.join('-'),
};

export default config;
