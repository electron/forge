# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Electron Forge is a Yarn 4 (Berry) + Lerna monorepo of TypeScript ESM packages published as `@electron-forge/*` (plus `create-electron-app`). All packages share one version (currently the Forge 8 alpha line, see `lerna.json`). Node >= 22.17 (`.nvmrc`).

## Commands

```bash
yarn                      # install; postinstall generates per-package tsconfig.json + packages/tsconfig.json and index.ts glue files
yarn build                # tsc -b packages (project references), then tools/test-dist verifies every package's entry point/typings exist
yarn build:watch

yarn lint                 # oxfmt --check + oxlint + markdownlint + lint on JS/TS code blocks in markdown + markdown link check
yarn lint:fix             # oxfmt --write + oxlint --fix
yarn constraints          # Yarn constraints (yarn.config.cjs): every workspace must use the same range for a shared dependency
yarn knip                 # unused files/exports/deps

yarn test:fast            # unit tests (vitest project "fast")
yarn test:slow            # *.slow.spec.ts (real packaging/making; 240s timeouts)
yarn test:verdaccio       # *.slow.verdaccio.spec.ts, run against a local Verdaccio registry the monorepo is published to
yarn test:clear           # clean up temp dirs left by tests
```

Run a single test file or test (arguments pass through to vitest):

```bash
yarn test:fast packages/api/core/spec/fast/make.spec.ts
yarn test:fast packages/api/core/spec/fast/make.spec.ts -t "some test name"
```

Run `yarn build` before testing: specs import their own package from `../src`, but other `@electron-forge/*` packages resolve through their `package.json` `exports`, which point at `dist/`. Vitest runs with `fileParallelism: false`.

The pre-commit hook runs `lint-staged` (oxfmt + oxlint) and `yarn constraints`. CI runs `yarn lint`, `yarn constraints` and `yarn knip`, then fast and slow tests on Windows, macOS and Linux. Changes that only touch `docs/` skip the test jobs.

## Architecture

Package groups under `packages/` (each a Yarn workspace, see root `package.json` `workspaces`):

- `api/core` (`@electron-forge/core`): the programmatic API (`src/api/{start,package,make,release}.ts`, exported as `api` from `src/api/index.ts`) and shared internals in `src/util/`.
- `api/cli` (`@electron-forge/cli`): a thin `commander` wrapper. `electron-forge.ts` runs a system check and then dispatches to one executable per subcommand (`electron-forge-<cmd>.ts`), and each of those calls the core API. `publish` is a deprecated, hidden alias for `release`.
- `external/create-electron-app`: project scaffolding (`init.ts`, `import.ts`, `init-scripts/`). `init`/`import` no longer live in core.
- `maker/*`: distributable formats. Each extends `MakerBase` from `maker/base` (`name`, `defaultPlatforms`, `isSupportedOnCurrentPlatform()`, `make()`, `requiredExternalBinaries`). Makers wrap external `electron-installer-*` style modules, which are _optional_ dependencies at the root.
- `publisher/*`: upload targets, extending `PublisherBase` (`publisher/base`). `base-static` is shared logic for object-storage publishers (S3, GCS).
- `plugin/*`: extend `PluginBase` (`plugin/base`). Plugins provide lifecycle hooks and can take over `start` (`startLogic`). `vite` and `webpack` are the bundler plugins.
- `template/*`: templates used by `create-electron-app`. `template/base` holds `BaseTemplate` and the shared `tmpl/` files. The vite and webpack templates extend it.
- `utils/*`: `shared-types` (in `utils/types`: `ForgeConfig`, the hook signatures and the maker/publisher/plugin interfaces that every package codes against), `core-utils` (package manager detection, `@electron/rebuild` wrapper, Electron version lookup), `multi-logger`, `tracer`, `test-utils`.

Key cross-cutting pieces in `api/core/src/util/`:

- `forge-config.ts` loads `forge.config.{ts,mts,cts,js,mjs,cjs}` (through `jiti`) or the `config.forge` field in `package.json`. The resolved config is wrapped in a `Proxy`: missing keys fall back to `ELECTRON_FORGE_*` env vars, and `fromBuildIdentifier()` values resolve per build identifier. Tests inject configs with `registerForgeConfigForDirectory()`.
- `import-search.ts` resolves makers, publishers, plugins and hooks given by name, relative to the user's project. Inside a Forge checkout it short-circuits `@electron-forge/*` names to the monorepo package.
- `plugin-interface.ts` + `hook.ts` hold the plugin lifecycle. There are simple hooks (`runHook`), mutating hooks that thread a value through each plugin (`runMutatingHook`), and hooks that return Listr tasks (`getHookListrTasks`). Commands are composed as `listr2` task lists.
- `package` wraps `@electron/packager` and injects Forge hooks into its `afterCopy`/`afterPrune`/`afterExtract` callbacks. `make` packages first, unless `--from-package` is given. `release` runs make, unless `--from-make` is given.

Build tooling: each package's `tsconfig.json` is **generated** by `tools/gen-tsconfigs.ts` from `tsconfig.base.json` plus its workspace dependencies. Don't hand-edit them; change the base or the generator. `spec/`, `tmpl/` and `index.ts` are excluded from compilation.

Tests live in each package's `spec/` directory. Suffixes choose the vitest project: `*.spec.ts` is fast, `*.slow.spec.ts` is slow and `*.slow.verdaccio.spec.ts` is slow-verdaccio. Fixture apps and configs for core live in `packages/api/core/spec/fixture/`.

## Docs

- `docs/` is the user-facing documentation site (Markdown/MDX with `sidebars.ts`). Update it when you change user-visible behavior. Markdown lint and link checks run on it.
- API docs come from TSDoc via `yarn docs` (typedoc). The rules in CONTRIBUTING.md: the first line is imperative ("Create", not "Creates"), is capitalized, ends with a period, doesn't start with "This", and isn't the function signature.

## Conventions

- Commit messages and PR titles use Conventional Commits (the `semantic` workflow checks the PR title), for example `fix(core): ...`, `feat(plugin-vite)!: ...`. Lerna derives version bumps from them, so don't bump versions in PRs.
- ESM throughout: relative imports inside `src/` use `.js` extensions. Unused variables or arguments must be prefixed with `_`.
- Keep a dependency's version range the same across all workspaces, or `yarn constraints` fails.
