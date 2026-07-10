// This fixture's `node_modules/typescript` is a TypeScript 7-shaped stub
// (`"type": "module"`, no root `"."` export) used to assert the loader's
// actionable error. It deliberately has no imports — the loader must fail
// before ever transpiling this file.
const config = {
  buildIdentifier: 'typescript-seven',
};

export default config;
