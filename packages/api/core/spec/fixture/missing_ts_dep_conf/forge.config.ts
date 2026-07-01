// This fixture is copied to a temporary directory (where no `typescript`
// package is resolvable) to assert the loader's helpful error message. It
// deliberately has no imports so it stands alone outside the repo.
const config = {
  buildIdentifier: 'missing-typescript',
};

export default config;
