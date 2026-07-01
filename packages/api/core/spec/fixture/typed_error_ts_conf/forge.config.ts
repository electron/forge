import { sep } from 'node:path';

// Deliberate type error (TS2339) that also crashes at runtime: the loader
// must surface the TypeScript diagnostic instead of the raw runtime error.
const buildIdentifier: string = sep.thisMethodDoesNotExist();

export default { buildIdentifier };
