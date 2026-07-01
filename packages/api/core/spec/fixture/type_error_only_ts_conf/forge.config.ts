// Deliberate type error (TS2322) in a config that loads fine at runtime:
// by default the loader must NOT type-check it (zero happy-path cost), but
// with FORGE_TYPECHECK_CONFIG set the load must fail with the diagnostic.
const buildIdentifier: number = 'type-error-only';

export default { buildIdentifier };
