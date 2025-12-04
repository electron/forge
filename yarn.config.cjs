// @ts-check

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require(`@yarnpkg/types`);

/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 */

const OPTIONAL_DEPS = [
  'electron-wix-msi',
  'electron-installer-dmg',
  'electron-installer-redhat',
  'electron-installer-snap',
  'electron-installer-debian',
  'electron-windows-msix',
  'electron-windows-store',
  'electron-winstaller',
  '@malept/electron-installer-flatpak',
];

/**
 * This rule will enforce that a workspace MUST depend on the same version of
 * a dependency as the one used by the other workspaces.
 *
 * @param {Context} context
 */
function enforceConsistentDependenciesAcrossTheProject({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) continue;
    // HACK: the `Dependency` type doesn't contain information about optionalDependencies
    // so skip them for now
    if (OPTIONAL_DEPS.includes(dependency.ident)) continue;

    // HACK: For now, we're using a different major version of Vite specifically for Vitest
    if (dependency.ident === 'vite') continue;

    for (const otherDependency of Yarn.dependencies({
      ident: dependency.ident,
    })) {
      if (otherDependency.type === `peerDependencies`) continue;

      dependency.update(otherDependency.range);
    }
  }
}

module.exports = defineConfig({
  constraints: async (ctx) => {
    enforceConsistentDependenciesAcrossTheProject(ctx);
  },
});
