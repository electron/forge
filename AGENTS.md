# AGENTS.md

Guidance for AI coding agents working in this repository.

## Overview

Electron Forge is a Yarn 4 + Lerna monorepo of TypeScript packages published as `@electron-forge/*` (plus `create-electron-app`). All packages share one version (`lerna.json`). Node version: `.nvmrc`.

This is Forge 8, and several things differ from Forge 7, which you may know better:

- Packages are ESM-only.
- `init`/`import` live in `create-electron-app`, not core.
- `publish` is renamed `release` (the old name remains as a deprecated alias).
- `make --skip-package` is now `--from-package`, and `release --from-dry-run` is now `--from-make`.
- The bundler plugins emit main and preload bundles as `.cjs`.
- PRs target `main`.

## Commands

```bash
yarn                      # install; postinstall regenerates the gitignored per-package tsconfig.json files and packages/tsconfig.json
yarn build                # ~5s; tsc -b packages, then tools/test-dist checks that every package's entry point exists and imports
yarn build:watch

yarn lint                 # oxfmt --check, oxlint, markdownlint, lint of code blocks in markdown, markdown link check
yarn lint:fix             # oxfmt --write + oxlint --fix
yarn constraints          # yarn.config.cjs: a dependency must use the same range in every workspace (--fix to apply)
yarn knip                 # unused files/exports/deps

yarn test:fast [file] [-t "name"]   # unit tests (*.spec.ts); the full suite takes ~25s
yarn test:slow [file]               # *.slow.spec.ts: downloads Electron, real packaging/making, 240s timeouts
yarn test:verdaccio [file]          # *.slow.verdaccio.spec.ts against a local registry holding the current build
yarn test:clear                     # remove temp dirs left behind by tests
```

## Verifying changes

- **Rebuild before testing across packages.** A spec imports its own package from `../src`. Every other `@electron-forge/*` import resolves through `package.json` `exports` to `dist/`. After editing package A, run `yarn build`, or keep `yarn build:watch` running, before testing anything that imports A.
- **Default to `yarn test:fast <file>`.** Run the slow or Verdaccio specs only when touching packaging, making, `init` or templates.
- **Don't run bare `yarn test`.** It includes the `slow-verdaccio` project without starting Verdaccio, so those specs install `@electron-forge/*` from the public registry and test the wrong code.
- **`test:fast`, `test:slow` and `test:verdaccio` run through `xvfb-maybe`.** On headless Linux without xvfb they exit with "Failed to find xvfb-run in PATH". Call vitest directly instead: `yarn vitest run --project fast <file>`, or `yarn spawn-verdaccio yarn vitest run --project slow-verdaccio <file>`.
- **Verdaccio specs need more setup.** They publish the current `dist/`, so build first. They also need network access, port 4873 free, `pnpm` on PATH, and npm >= 11.17 for install age-gating.
- **Specs are not type-checked.** `tsconfig.base.json` excludes `spec/`, and vitest strips types. A green build doesn't prove spec types are right.
- **Try a change in a real app:** `yarn build && LINK_FORGE_DEPENDENCIES_ON_INIT=1 node packages/external/create-electron-app/dist/index.js <dir> --package-manager pnpm`. Then check that `<dir>/node_modules/@electron-forge/cli` resolves into this repo.
  - Only pnpm links reliably.
  - With npm, the default when there's no TTY, linking reports success, but the install that follows replaces the links with published packages.
  - Yarn works only if Corepack provides Yarn 4. Yarn 1's `yarn link` fails.
- **Debug logging:** `DEBUG=electron-forge:*` traces CLI and core internals.
- **Parts of `CONTRIBUTING.md` are stale.** Its "Running Forge locally" and test instructions mention `yarn link:prepare`, `yarn build:fast` and `yarn test`, and it says the website docs live in a separate repo. Follow this file instead where they conflict.

The pre-commit hook runs `lint-staged` (oxfmt + oxlint) and `yarn constraints`. CI runs build, then `yarn lint`, `yarn constraints` and `yarn knip`, then the test suites on Windows, macOS and Linux. Changes that only touch `docs/` skip the test jobs.

## Architecture

Package groups under `packages/` (each is a Yarn workspace):

- `api/core`: the programmatic API (`src/api/{start,package,make,release}.ts`) and shared internals in `src/util/`.
- `api/cli`: a thin `commander` wrapper. It dispatches to one executable per subcommand (`electron-forge-<cmd>.ts`), and each of those calls the core API.
- `external/create-electron-app`: project scaffolding (`init.ts`, `import.ts`, `init-scripts/`).
- `maker/*`, `publisher/*`, `plugin/*`: implementations of `MakerBase`, `PublisherBase` and `PluginBase` from the matching `*/base` package.
  - Most makers wrap a third-party installer module (`electron-installer-*`, `electron-winstaller`, …), usually declared in `optionalDependencies`. `yarn constraints` skips only the names hard-coded in `OPTIONAL_DEPS` in `yarn.config.cjs`, so add a new installer there.
  - `publisher/base-static` is shared logic for object-storage publishers (S3, GCS).
  - Plugins provide lifecycle hooks and can take over `start` (`startLogic`). `vite` and `webpack` are the bundler plugins.
- `template/*`: templates used by `create-electron-app`. `template/base` has `BaseTemplate` and the shared `tmpl/` files, and the vite and webpack templates extend it.
- `utils/*`:
  - `shared-types` lives in `utils/types`. It defines `ForgeConfig`, the hook signatures and the maker/publisher/plugin interfaces that every package codes against.
  - `core-utils` covers package manager detection, the `@electron/rebuild` wrapper and Electron version lookup.
  - Also: `multi-logger`, `tracer`, `test-utils`.

Cross-cutting pieces in `api/core/src/util/`:

- **`forge-config.ts` loads the config.**
  - Precedence: a config registered with `registerForgeConfigForDirectory()` (used by tests), then a `package.json` `config.forge` object, then the first `forge.config.{js,mjs,cjs,ts,mts,cts}` found. A `config.forge` _path string_ is used only when no `forge.config.*` file exists.
  - TS configs load through `jiti`, JS configs through `import()`.
  - After the `resolveForgeConfig` hook runs, the config is wrapped in a `Proxy`. Missing keys fall back to `ELECTRON_FORGE_<KEY>` env vars, and `fromBuildIdentifier()` values resolve per `buildIdentifier`.
- **`import-search.ts` resolves by name** the makers, publishers and plugins in the config, plus `packagerConfig` hooks given as strings. It tries the bare specifier, then a path relative to the project, then the project's `node_modules`, and uses only the module's default export.
- **`plugin-interface.ts` + `hook.ts` run the plugin lifecycle.** There are three kinds of hook:
  - simple hooks (`runHook`)
  - mutating hooks that thread a value through each plugin (`runMutatingHook`)
  - hooks that return `listr2` tasks (`getHookListrTasks`)

  Commands are built as `listr2` task lists.

- **The commands chain together.** `package` wraps `@electron/packager` and injects Forge hooks into its `afterCopy`/`afterPrune`/`afterExtract` callbacks. `make` runs package first unless given `--from-package`, and `release` runs make first unless given `--from-make`.

Tests live in each package's `spec/`, and the filename suffix picks the vitest project (see the test commands above). Spec files run serially (`fileParallelism: false`) because many write into shared on-disk fixtures. Each file gets fresh module state, but registered configs and mocks persist between tests in the same file, so unregister them in `afterEach`. Core's fixture apps and configs are in `packages/api/core/spec/fixture/`.

## Gotchas

- **Coupled changes.** A behavior change in a bundler plugin usually also needs updates to the templates' `tmpl/` files (what users actually get) and to `docs/config/plugins/`.
- **Two sets of docs.** `docs/` is the user-facing docs site. New pages must be registered in `docs/sidebars.ts`. The site isn't built in this repo. Markdown lint and the link check cover only `*.md`, so `.mdx` pages (including `docs/config/plugins/vite.mdx` and `webpack.mdx`) aren't checked at all; review them by hand. Each package's `README.md` is separate, hand-written, and published to npm.
- **Dependency install policy.** `.yarnrc.yml` rejects versions published less than 7 days ago (`npmMinimalAgeGate`), except for pre-approved scopes, and disables install scripts, except those allowed in `dependenciesMeta`. CI installs with `--immutable`, so commit `yarn.lock`.
- **Generated project references.** Each package's `tsconfig.json` is generated from `tsconfig.base.json` and its workspace dependencies by `tools/gen-tsconfigs.ts`, so don't hand-edit it. After adding or removing an `@electron-forge/*` dependency, re-run `yarn`, or `tsc -b` fails.
- **Adding a package.**
  1. Put it under an existing `workspaces` glob.
  2. Set its version to the one in `lerna.json`, and depend on sibling packages with `workspace:*`.
  3. Run `yarn`.
  4. Add a workspace entry to `knip.json`.
  5. Check the `typedoc.jsonc` entry points.
  6. Copy the `exports`, `typings` and `publishConfig` fields from a sibling package. `tools/test-dist` fails without the entry point and typings.
- **Imports.** Relative imports in `src/` use `.js` extensions. Some type-only re-exports use `.ts`, but `.js` also works there. Specs import `../src/...` without an extension; don't copy that style into `src/`.
- **Commit messages.** Commits and PR titles use Conventional Commits (the `semantic` workflow checks PR titles), for example `fix(core): ...` or `feat(plugin-vite)!: ...`. Lerna derives version bumps from them, so don't bump versions in PRs.
- **TSDoc style.** Follow the rules in `CONTRIBUTING.md`: the first line is imperative, capitalized and ends with a period.
