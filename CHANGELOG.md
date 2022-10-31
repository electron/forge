#### [6.0.0-beta.72](https://github.com/electron/forge/releases/tag/v6.0.0-beta.72) (2022-10-31)

#### [6.0.0-beta.71](https://github.com/electron/forge/releases/tag/v6.0.0-beta.71) (2022-10-31)

##### Bug Fixes

- **packager:** "packaging application" log never stops when building for multiple architectures (#3006) ([247f52ab](https://github.com/electron/forge/commit/247f52ab))
- **publish:** ignore unnecessary files when publishing to npm (#3024) ([ab8ea661](https://github.com/electron/forge/commit/ab8ea661))
- **template-base:** use minimum instead of exact version when replacing `ELECTRON_FORGE/VERSION` in templates (#3030) ([7aaa7029](https://github.com/electron/forge/commit/7aaa7029))
- use @electron-forge/cli hint for project resolution (#3023) ([b5d05874](https://github.com/electron/forge/commit/b5d05874))
- restore isProd in the webpack plugin (#3021) ([531788ba](https://github.com/electron/forge/commit/531788ba))

#### [6.0.0-beta.70](https://github.com/electron/forge/releases/tag/v6.0.0-beta.70) (2022-10-28)

##### Bug Fixes

- **template-typescript-webpack:**
  - install ts-node (#3016) ([ab160d5d](https://github.com/electron/forge/commit/ab160d5d))
  - webpack entrypoint extensions (#3014) ([378e2009](https://github.com/electron/forge/commit/378e2009))
  - clean up forge config code (#3009) ([c3a8db44](https://github.com/electron/forge/commit/c3a8db44))

#### [6.0.0-beta.69](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.69) (2022-10-27)

##### New Features

- **publisher-s3:** Add sessionToken and change default fallback (#2984) ([72b80a7f](https://github.com/electron-userland/electron-forge/commit/72b80a7f))
- add support for forge.config.ts et. al (#2993) ([e404bf10](https://github.com/electron-userland/electron-forge/commit/e404bf10))
- **plugin-webpack:** support standalone preload entry points (#2950) ([93b31c7d](https://github.com/electron-userland/electron-forge/commit/93b31c7d))

##### Bug Fixes

- **plugin-webpack:** keep `devDependencies`, `dependencies`, `optionalDependencies` and `peerDependencies` in the distributed package.json (#3007) ([0f75ce08](https://github.com/electron-userland/electron-forge/commit/0f75ce08))
- **template-webpack:** use new plugin syntax (#2990) ([14721498](https://github.com/electron-userland/electron-forge/commit/14721498))
- **template-typescript-webpack:** use new plugin syntax (#2989) ([4f222f48](https://github.com/electron-userland/electron-forge/commit/4f222f48))

##### Other Changes

- prefer forge.config.js over package.json config (#2991) ([777197e5](https://github.com/electron-userland/electron-forge/commit/777197e5))

#### [6.0.0-beta.68](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.68) (2022-10-24)

##### Bug Fixes

- **docs:**
  - only load modules if package has entry point (#2981) ([bb29cd51](https://github.com/electron-userland/electron-forge/commit/bb29cd51))
  - only publish API docs on v6 tags (#2976) ([a8b9dfc5](https://github.com/electron-userland/electron-forge/commit/a8b9dfc5))
- pin gh-actions to SHAs, update to remove deprecation warning (#2966) ([fbc92e46](https://github.com/electron-userland/electron-forge/commit/fbc92e46))
- **plugin-webpack:** better webpack-dev-server types (#2952) ([6c0c222b](https://github.com/electron-userland/electron-forge/commit/6c0c222b))

##### Other Changes

- upgrade electron-packager@17 (#2978) ([629872da](https://github.com/electron-userland/electron-forge/commit/629872da))
- improve forge configuration DX (#2963) ([2c12d73f](https://github.com/electron-userland/electron-forge/commit/2c12d73f))
- **maker-pkg:** upgrade to `@electron/osx-sign` (#2959) ([dba93590](https://github.com/electron-userland/electron-forge/commit/dba93590))

#### [6.0.0-beta.67](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.67) (2022-10-05)

##### New Features

- remove preload.js from TypeScript templates (#2938) ([50484dcc](https://github.com/electron-userland/electron-forge/commit/50484dcc))

##### Bug Fixes

- **template-typescript-webpack:** preload file to webpack config (#2936) ([cb1e5600](https://github.com/electron-userland/electron-forge/commit/cb1e5600))

#### [6.0.0-beta.66](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.66) (2022-09-07)

##### New Features

- **plugin-webpack:** Allow each entrypoints to specify `nodeIntegration` (#2867) ([1f45e2ca](https://github.com/electron-userland/electron-forge/commit/1f45e2ca))

##### Other Changes

- update got to 2.0.0 (#2924) ([23eebf19](https://github.com/electron-userland/electron-forge/commit/23eebf19))

#### [6.0.0-beta.65](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.65) (2022-07-25)

##### Bug Fixes

- add missing exports from packages (#2920) ([460546b7](https://github.com/electron-userland/electron-forge/commit/460546b7))
- keep stdin unpaused after ora completes (#2904) ([aad9c7e4](https://github.com/electron-userland/electron-forge/commit/aad9c7e4))

##### Chores

- upgrade Node.js to 14 LTS (#2921) ([4dcca1ce](https://github.com/electron-userland/electron-forge/commit/4dcca1ce))

#### [6.0.0-beta.64](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.64) (2022-06-16)

##### New Features

- **webpack-plugin:** webpack 5 configuration factory (#2776) ([f4a77741](https://github.com/electron-userland/electron-forge/commit/f4a77741))
- 🎸 allow specifying alternative tag prefix (#2605) ([88d9d722](https://github.com/electron-userland/electron-forge/commit/88d9d722))
- allow disabling maker in config (#2754) ([69777402](https://github.com/electron-userland/electron-forge/commit/69777402))
- 🎸 Add packageSourceMaps option to WebpackPluginConfig (#2581) ([2bb5e0d8](https://github.com/electron-userland/electron-forge/commit/2bb5e0d8))
- Make autoUpdate and autoLaunch features configurable in MakerWixConfig (#2620) ([bf7d271a](https://github.com/electron-userland/electron-forge/commit/bf7d271a))
- **publisher-ers:** support flavor config (#2766) ([6069ebe1](https://github.com/electron-userland/electron-forge/commit/6069ebe1))
- **cli:** add --inspect-brk-electron option (#1328) ([c5a6ea17](https://github.com/electron-userland/electron-forge/commit/c5a6ea17))
- **template:** add a default preload script (#2722) ([636e2c5d](https://github.com/electron-userland/electron-forge/commit/636e2c5d))
- **plugin-webpack:** allow specifing a seperate webpack config for your preload (#2679) ([f5909424](https://github.com/electron-userland/electron-forge/commit/f5909424))

##### Bug Fixes

- escape file names for `make` step (#2752) ([beb93056](https://github.com/electron-userland/electron-forge/commit/beb93056))
- default platforms to empty array instead of null ([9abc581b](https://github.com/electron-userland/electron-forge/commit/9abc581b))
- **publisher-electron-release-server:**
  - set knownLength option for asset upload (#2706) ([cf08cd62](https://github.com/electron-userland/electron-forge/commit/cf08cd62))
  - omit RELEASES file when uploading assets (#2089) ([2202dcd3](https://github.com/electron-userland/electron-forge/commit/2202dcd3))

#### [6.0.0-beta.63](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.63) (2022-01-10)

##### Bug Fixes

- **cli:** re-add shebang to electron-forge binary (#2671) ([1ca418ec](https://github.com/electron-userland/electron-forge/commit/1ca418ec))

#### [6.0.0-beta.62](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.62) (2022-01-09)

##### New Features

- **publisher-github:** add retry support (#2550) ([a400066d](https://github.com/electron-userland/electron-forge/commit/a400066d))

##### Bug Fixes

- replace colors with chalk (#2666) ([e909ae83](https://github.com/electron-userland/electron-forge/commit/e909ae83))
- **plugin-webpack:**
  - rebuild native modules before packaging (#2584) ([21310bbf](https://github.com/electron-userland/electron-forge/commit/21310bbf))
  - validate that the correct entry point is used (#2522) ([3de904b6](https://github.com/electron-userland/electron-forge/commit/3de904b6))

#### [6.0.0-beta.61](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.61) (2021-09-10)

##### New Features

- **publisher-github:** add debug support for Octokit (#2499) ([73252c30](https://github.com/electron-userland/electron-forge/commit/73252c30))

##### Bug Fixes

- unpin electron-notarize (#2515) ([af78353b](https://github.com/electron-userland/electron-forge/commit/af78353b))

#### [6.0.0-beta.60](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.60) (2021-08-30)

##### New Features

- **plugin-webpack:** allow most webpack-dev-server options to be configurable (#2444) ([699d4862](https://github.com/electron-userland/electron-forge/commit/699d4862))
- **deps:** upgrade to electron-rebuild@^3.1.1 (#2434) ([60778998](https://github.com/electron-userland/electron-forge/commit/60778998))

##### Bug Fixes

- **core:**
  - better errors when maker names are invalid (#2467) ([ca41d9ba](https://github.com/electron-userland/electron-forge/commit/ca41d9ba))
  - add support for finding electron for npm 7 workspaces (#2446) ([4c601519](https://github.com/electron-userland/electron-forge/commit/4c601519))
- **plugin-webpack:**
  - fix deprecation warnings for dev-server@4.0.0 (#2457) ([99797449](https://github.com/electron-userland/electron-forge/commit/99797449))
  - don't specify resolve.modules by default (#2149) ([4a992b76](https://github.com/electron-userland/electron-forge/commit/4a992b76))
  - don't show the error message if packagerConfig.ignore is a function (#2424) ([4b4f16c3](https://github.com/electron-userland/electron-forge/commit/4b4f16c3))
- **template-webpack:** only use node-loader if the .node files are in native_modules/ (#2449) ([bd2526b3](https://github.com/electron-userland/electron-forge/commit/bd2526b3))
- **maker-dmg:** add the arch to the default dmg name (#2431) ([0c65f17d](https://github.com/electron-userland/electron-forge/commit/0c65f17d))

##### Other Changes

- **core:** add required Forge version for templates (#2415) ([c094d168](https://github.com/electron-userland/electron-forge/commit/c094d168))

#### [6.0.0-beta.59](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.59) (2021-07-26)

##### Bug Fixes

- **template-typescript-webpack:** lint tsx files by default (#2403) ([c2e6c49f](https://github.com/electron-userland/electron-forge/commit/c2e6c49f))
- **template:** add plugin:import/electron to TypeScript ESLint config (#2399) ([f42c962a](https://github.com/electron-userland/electron-forge/commit/f42c962a))
- **webpack-plugin:** Ensure asset relocator injected code works with nodeIntegration disabled (#2396) ([146fc311](https://github.com/electron-userland/electron-forge/commit/146fc311))

#### [6.0.0-beta.58](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.58) (2021-07-18)

##### New Features

- **plugin-webpack:**
  - improve native asset relocation without forking Vercel loader (#2320) ([db8a3f39](https://github.com/electron-userland/electron-forge/commit/db8a3f39))
  - add devContentSecurityPolicy config option (#2332) ([7d461090](https://github.com/electron-userland/electron-forge/commit/7d461090))
  - add nodeIntegration config for renderers (#2330) ([6e0a6248](https://github.com/electron-userland/electron-forge/commit/6e0a6248))
- **core:** add `platform` and `arch` to `generateAssets` hook parameters (#2327) ([e3af089d](https://github.com/electron-userland/electron-forge/commit/e3af089d))

##### Bug Fixes

- **core:** search for electron in a `node_modules` folder with electron in it (#2326) ([43cbb0a6](https://github.com/electron-userland/electron-forge/commit/43cbb0a6))
- **plugin-electronegativity:** add parserPlugins option (#2323) ([c7eff261](https://github.com/electron-userland/electron-forge/commit/c7eff261))
- **plugin-webpack:** throw error if something bad happened in preload compilation (#2334) ([755a4502](https://github.com/electron-userland/electron-forge/commit/755a4502))
- **maker-squirrel:** use executableName for exe when available (#2365) ([52f71443](https://github.com/electron-userland/electron-forge/commit/52f71443))

#### [6.0.0-beta.57](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.57) (2021-05-23)

##### Chores

- set up typeRoots for package tsconfig (#2286) ([d378b201](https://github.com/electron-userland/electron-forge/commit/d378b201))

##### Bug Fixes

- **webpack-plugin:** add web as a target for the renderer process (#2285) ([9f2bc411](https://github.com/electron-userland/electron-forge/commit/9f2bc411))

#### [6.0.0-beta.56](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.56) (2021-05-22)

##### Build System / Dependencies

- **deps-dev:**
  - bump ts-loader (#2282) ([8293fe75](https://github.com/electron-userland/electron-forge/commit/8293fe75))
  - bump node-loader (#2219) ([0c980dae](https://github.com/electron-userland/electron-forge/commit/0c980dae))
  - bump node-loader in /packages/template/webpack/tmpl (#2218) ([0ff2a518](https://github.com/electron-userland/electron-forge/commit/0ff2a518))

##### Chores

- require Node 12 for all packages (#2281) ([8fbbad24](https://github.com/electron-userland/electron-forge/commit/8fbbad24))

##### Bug Fixes

- **plugin-local-electron:** bind methods correctly (#2280) ([e60445d7](https://github.com/electron-userland/electron-forge/commit/e60445d7))

##### Other Changes

- **webpack-plugin:** upgrade to Webpack 5 (#2225) ([564a4451](https://github.com/electron-userland/electron-forge/commit/564a4451))

#### [6.0.0-beta.55](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.55) (2021-05-18)

##### Build System / Dependencies

- **deps:**
  - upgrade transitive dependencies ([a06b5b7d](https://github.com/electron-userland/electron-forge/commit/a06b5b7d))
  - bump ssri from 6.0.1 to 6.0.2 ([2215dac5](https://github.com/electron-userland/electron-forge/commit/2215dac5))
  - upgrade xterm to 4.12.0 ([0a8b1fb1](https://github.com/electron-userland/electron-forge/commit/0a8b1fb1))
  - upgrade webpack-dev-middleware to 4.2.0 ([790647dc](https://github.com/electron-userland/electron-forge/commit/790647dc))
  - upgrade semver to 7.3.5 ([30be10a6](https://github.com/electron-userland/electron-forge/commit/30be10a6))
  - upgrade ora to 5.4.0 ([c1866c46](https://github.com/electron-userland/electron-forge/commit/c1866c46))
  - upgrade mime-types to 2.1.30 ([679b3610](https://github.com/electron-userland/electron-forge/commit/679b3610))
  - upgrade glob to 7.1.7 ([ce94a505](https://github.com/electron-userland/electron-forge/commit/ce94a505))
  - upgrade electron-wix-msi to 3.2.0 ([cfce085e](https://github.com/electron-userland/electron-forge/commit/cfce085e))
  - upgrade aws-sdk to 2.908.0 ([f7a9dd53](https://github.com/electron-userland/electron-forge/commit/f7a9dd53))
  - upgrade @octokit/types to 6.14.2 ([c636a05b](https://github.com/electron-userland/electron-forge/commit/c636a05b))
  - upgrade @octokit/rest to 18.5.3 ([f5e57ae6](https://github.com/electron-userland/electron-forge/commit/f5e57ae6))
  - upgrade @octokit/core to 3.4.0 ([33d51315](https://github.com/electron-userland/electron-forge/commit/33d51315))
  - upgrade @malept/electron-installer-flatpak to 0.11.3 ([31449bcd](https://github.com/electron-userland/electron-forge/commit/31449bcd))
  - upgrade @doyensec/electronegativity to 1.9.0 ([f07333c6](https://github.com/electron-userland/electron-forge/commit/f07333c6))
  - bump codecov/codecov-action from 1.3.2 to 1.5.0 ([17693ba0](https://github.com/electron-userland/electron-forge/commit/17693ba0))
  - bump actions/checkout from 2 to 2.3.4 ([e4501d4e](https://github.com/electron-userland/electron-forge/commit/e4501d4e))
  - bump actions/setup-node from 2.1.4 to 2.1.5 ([cc4d2965](https://github.com/electron-userland/electron-forge/commit/cc4d2965))
  - bump actions/cache from 2 to 2.1.5 ([5024a135](https://github.com/electron-userland/electron-forge/commit/5024a135))
  - bump hosted-git-info from 2.8.8 to 2.8.9 ([534ac327](https://github.com/electron-userland/electron-forge/commit/534ac327))
  - bump codecov/codecov-action from v1.3.1 to v1.3.2 ([e1c218c1](https://github.com/electron-userland/electron-forge/commit/e1c218c1))
  - bump codecov/codecov-action from v1.2.2 to v1.3.1 ([785e9c0d](https://github.com/electron-userland/electron-forge/commit/785e9c0d))
  - bump codecov/codecov-action from v1.1.1 to v1.2.2 (#2195) ([60765e3f](https://github.com/electron-userland/electron-forge/commit/60765e3f))
  - upgrade xterm to 4.11.0 ([a4f187f5](https://github.com/electron-userland/electron-forge/commit/a4f187f5))
  - upgrade aws-sdk to 2.861.0 ([bfa508dc](https://github.com/electron-userland/electron-forge/commit/bfa508dc))
  - upgrade @octokit/core to 3.3.0 ([ae4c7862](https://github.com/electron-userland/electron-forge/commit/ae4c7862))
  - upgrade aws-sdk to 2.859.0 ([a9392ec6](https://github.com/electron-userland/electron-forge/commit/a9392ec6))
  - upgrade @octokit/types to 6.12.2 ([862a442b](https://github.com/electron-userland/electron-forge/commit/862a442b))
  - upgrade @octokit/rest to 18.3.5 ([42fbffaa](https://github.com/electron-userland/electron-forge/commit/42fbffaa))
  - upgrade xterm-addon-search to ^0.8.0 ([97bd764e](https://github.com/electron-userland/electron-forge/commit/97bd764e))
  - upgrade xterm-addon-fit to ^0.5.0 ([57b6ef94](https://github.com/electron-userland/electron-forge/commit/57b6ef94))
  - upgrade xterm to 4.10.0 ([c79a75e7](https://github.com/electron-userland/electron-forge/commit/c79a75e7))
  - upgrade webpack-dev-middleware to 4.1.0 ([80be342c](https://github.com/electron-userland/electron-forge/commit/80be342c))
  - upgrade ora to 5.3.0 ([0f68143a](https://github.com/electron-userland/electron-forge/commit/0f68143a))
  - upgrade mime-types to 2.1.29 ([6a00d05c](https://github.com/electron-userland/electron-forge/commit/6a00d05c))
  - upgrade lodash to 4.17.21 ([5507ecec](https://github.com/electron-userland/electron-forge/commit/5507ecec))
  - upgrade inquirer to ^8.0.0 ([ab086543](https://github.com/electron-userland/electron-forge/commit/ab086543))
  - upgrade fs-extra to 9.1.0 ([6a62710f](https://github.com/electron-userland/electron-forge/commit/6a62710f))
  - upgrade form-data to ^4.0.0 ([d83d8cc6](https://github.com/electron-userland/electron-forge/commit/d83d8cc6))
  - upgrade electron-winstaller to ^5.0.0 ([e93631a3](https://github.com/electron-userland/electron-forge/commit/e93631a3))
  - upgrade electron-rebuild to 2.3.5 ([5b9dc99d](https://github.com/electron-userland/electron-forge/commit/5b9dc99d))
  - upgrade electron-installer-redhat to 3.3.0 ([a6a82b8b](https://github.com/electron-userland/electron-forge/commit/a6a82b8b))
  - upgrade aws-sdk to 2.856.0 ([75d14090](https://github.com/electron-userland/electron-forge/commit/75d14090))
  - upgrade @octokit/types to 6.11.2 ([7a5fd8cc](https://github.com/electron-userland/electron-forge/commit/7a5fd8cc))
  - upgrade @octokit/rest to 18.3.2 ([6276eb9f](https://github.com/electron-userland/electron-forge/commit/6276eb9f))
  - upgrade @octokit/core to 3.2.5 ([dbe228bb](https://github.com/electron-userland/electron-forge/commit/dbe228bb))
  - upgrade @electron/get to 1.12.4 ([b1aea91d](https://github.com/electron-userland/electron-forge/commit/b1aea91d))
  - upgrade @doyensec/electronegativity to 1.8.1 ([5374adf4](https://github.com/electron-userland/electron-forge/commit/5374adf4))
  - bump @types/which from 1.3.2 to 2.0.0 ([a098defc](https://github.com/electron-userland/electron-forge/commit/a098defc))
  - bump webpack-merge from 5.7.2 to 5.7.3 (#2108) ([68e1b262](https://github.com/electron-userland/electron-forge/commit/68e1b262))
  - bump @octokit/types from 6.1.1 to 6.1.2 (#2103) ([665c91a9](https://github.com/electron-userland/electron-forge/commit/665c91a9))
  - bump codecov/codecov-action from v1.1.0 to v1.1.1 ([ad7e1854](https://github.com/electron-userland/electron-forge/commit/ad7e1854))
  - bump codecov/codecov-action from v1.0.15 to v1.1.0 ([70505507](https://github.com/electron-userland/electron-forge/commit/70505507))
  - bump webpack-merge from 5.7.0 to 5.7.2 (#2096) ([4824af6f](https://github.com/electron-userland/electron-forge/commit/4824af6f))
  - bump actions/setup-node from v2.1.3 to v2.1.4 ([a5b11e93](https://github.com/electron-userland/electron-forge/commit/a5b11e93))
  - bump webpack-merge from 5.5.0 to 5.7.0 (#2086) ([3bef3127](https://github.com/electron-userland/electron-forge/commit/3bef3127))
  - bump electron-wix-msi from 3.0.4 to 3.0.6 (#2082) ([6a08ccfd](https://github.com/electron-userland/electron-forge/commit/6a08ccfd))
  - bump webpack-merge from 5.4.1 to 5.5.0 (#2080) ([cd43d4ec](https://github.com/electron-userland/electron-forge/commit/cd43d4ec))
  - bump actions/setup-node from v2.1.2 to v2.1.3 ([975926ac](https://github.com/electron-userland/electron-forge/commit/975926ac))
  - bump ini from 1.3.5 to 1.3.7 ([814f7cef](https://github.com/electron-userland/electron-forge/commit/814f7cef))
  - upgrade transitive dependencies ([da3d2f28](https://github.com/electron-userland/electron-forge/commit/da3d2f28))
  - upgrade webpack-merge to 5.4.1 ([c6d88238](https://github.com/electron-userland/electron-forge/commit/c6d88238))
  - upgrade aws-sdk to 2.806.0 ([362fed28](https://github.com/electron-userland/electron-forge/commit/362fed28))
  - upgrade @octokit/types to 6.1.1 ([c3f3a88f](https://github.com/electron-userland/electron-forge/commit/c3f3a88f))
  - bump @malept/cross-spawn-promise from 1.1.0 to 1.1.1 (#2068) ([6739d2ca](https://github.com/electron-userland/electron-forge/commit/6739d2ca))
  - upgrade transitive dependencies ([c883d49e](https://github.com/electron-userland/electron-forge/commit/c883d49e))
  - upgrade electron-packager to 15.2.0 ([f21d1705](https://github.com/electron-userland/electron-forge/commit/f21d1705))
  - upgrade aws-sdk to 2.804.0 ([e32441ec](https://github.com/electron-userland/electron-forge/commit/e32441ec))
  - upgrade @octokit/types to 6.1.0 ([c25ca682](https://github.com/electron-userland/electron-forge/commit/c25ca682))
  - upgrade @octokit/rest to 18.0.12 ([3e780fb4](https://github.com/electron-userland/electron-forge/commit/3e780fb4))
  - bump highlight.js from 10.4.0 to 10.4.1 ([fc0857fb](https://github.com/electron-userland/electron-forge/commit/fc0857fb))
  - bump @octokit/core from 3.2.3 to 3.2.4 (#2064) ([b391ee54](https://github.com/electron-userland/electron-forge/commit/b391ee54))
  - bump @octokit/rest from 18.0.9 to 18.0.11 (#2062) ([25efb2a0](https://github.com/electron-userland/electron-forge/commit/25efb2a0))
  - upgrade @octokit dependencies ([600f4618](https://github.com/electron-userland/electron-forge/commit/600f4618))
  - upgrade semver to 7.3.4 ([723ef8c6](https://github.com/electron-userland/electron-forge/commit/723ef8c6))
  - upgrade electron-rebuild to 2.3.4 ([1cdc424a](https://github.com/electron-userland/electron-forge/commit/1cdc424a))
  - upgrade aws-sdk to 2.802.0 ([65412fd7](https://github.com/electron-userland/electron-forge/commit/65412fd7))
  - upgrade aws-sdk to 2.798.0 ([8e44d15b](https://github.com/electron-userland/electron-forge/commit/8e44d15b))
  - bump debug from 4.2.0 to 4.3.1 (#2046) ([d343a631](https://github.com/electron-userland/electron-forge/commit/d343a631))
  - upgrade transitive dependencies ([183129d4](https://github.com/electron-userland/electron-forge/commit/183129d4))
  - upgrade aws-sdk to 2.795.0 ([d6c62e14](https://github.com/electron-userland/electron-forge/commit/d6c62e14))
  - bump codecov/codecov-action from v1.0.14 to v1.0.15 (#2041) ([1357ab07](https://github.com/electron-userland/electron-forge/commit/1357ab07))
  - upgrade aws-sdk to 2.793.0 ([44d26b72](https://github.com/electron-userland/electron-forge/commit/44d26b72))
  - bump webpack-merge from 5.3.0 to 5.4.0 (#2037) ([b83edf44](https://github.com/electron-userland/electron-forge/commit/b83edf44))
  - bump webpack-dev-middleware from 4.0.0 to 4.0.2 (#2032) ([34e4eb57](https://github.com/electron-userland/electron-forge/commit/34e4eb57))
  - upgrade webpack-merge to 5.3.0 ([8a0f6f07](https://github.com/electron-userland/electron-forge/commit/8a0f6f07))
  - upgrade webpack-dev-middleware to ^4.0.0 ([ea548c96](https://github.com/electron-userland/electron-forge/commit/ea548c96))
  - upgrade electron-osx-sign to ^0.5.0 ([654a6ca9](https://github.com/electron-userland/electron-forge/commit/654a6ca9))
  - upgrade aws-sdk to 2.787.0 ([fff66f25](https://github.com/electron-userland/electron-forge/commit/fff66f25))
  - upgrade @octokit/rest to 18.0.9 ([5fb6be80](https://github.com/electron-userland/electron-forge/commit/5fb6be80))
  - upgrade @octokit/core to 3.2.1 ([813ef397](https://github.com/electron-userland/electron-forge/commit/813ef397))
  - upgrade @octokit/rest to 18.0.7 ([87d0dfd7](https://github.com/electron-userland/electron-forge/commit/87d0dfd7))
  - upgrade aws-sdk to 2.782.0 ([7c97efb7](https://github.com/electron-userland/electron-forge/commit/7c97efb7))
  - upgrade @octokit/core to 3.2.0 ([216b7c36](https://github.com/electron-userland/electron-forge/commit/216b7c36))
  - bump @octokit/core from 3.1.3 to 3.1.4 (#2007) ([eb5c55ab](https://github.com/electron-userland/electron-forge/commit/eb5c55ab))
  - bump electron-rebuild from 2.3.1 to 2.3.2 (#2001) ([02ee708a](https://github.com/electron-userland/electron-forge/commit/02ee708a))
- **deps-dev:**
  - upgrade typedoc to 0.20.36 ([0d119e3a](https://github.com/electron-userland/electron-forge/commit/0d119e3a))
  - upgrade sinon to ^10.0.0 ([a4769789](https://github.com/electron-userland/electron-forge/commit/a4769789))
  - upgrade mocha to 8.4.0 ([83b3ebf6](https://github.com/electron-userland/electron-forge/commit/83b3ebf6))
  - upgrade husky to ^6.0.0 ([ee947071](https://github.com/electron-userland/electron-forge/commit/ee947071))
  - upgrade globby to 11.0.3 ([6ccbbbff](https://github.com/electron-userland/electron-forge/commit/6ccbbbff))
  - upgrade eslint-plugin-import to 2.23.2 ([50dbec78](https://github.com/electron-userland/electron-forge/commit/50dbec78))
  - upgrade eslint to 7.26.0 ([ea50e376](https://github.com/electron-userland/electron-forge/commit/ea50e376))
  - upgrade commitizen to 4.2.4 ([1576e25f](https://github.com/electron-userland/electron-forge/commit/1576e25f))
  - upgrade chai to 4.3.4 ([98d81402](https://github.com/electron-userland/electron-forge/commit/98d81402))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.24.0 ([017dbf5f](https://github.com/electron-userland/electron-forge/commit/017dbf5f))
  - upgrade @types/sinon to ^10.0.0 ([14952e4a](https://github.com/electron-userland/electron-forge/commit/14952e4a))
  - upgrade @types/semver to 7.3.6 ([06c37b6c](https://github.com/electron-userland/electron-forge/commit/06c37b6c))
  - upgrade @types/node-fetch to 2.5.10 ([3a9ba43f](https://github.com/electron-userland/electron-forge/commit/3a9ba43f))
  - upgrade @types/node to ^15.3.0 ([36c66456](https://github.com/electron-userland/electron-forge/commit/36c66456))
  - upgrade @types/mocha to 8.2.2 ([3c5a0014](https://github.com/electron-userland/electron-forge/commit/3c5a0014))
  - upgrade @types/lodash to 4.14.169 ([74fefb75](https://github.com/electron-userland/electron-forge/commit/74fefb75))
  - upgrade @types/listr to 0.14.3 ([26de3130](https://github.com/electron-userland/electron-forge/commit/26de3130))
  - upgrade @types/fs-extra to 9.0.11 ([5880ef22](https://github.com/electron-userland/electron-forge/commit/5880ef22))
  - upgrade @types/chai-as-promised to 7.1.4 ([488c4ac2](https://github.com/electron-userland/electron-forge/commit/488c4ac2))
  - upgrade @types/chai to 4.2.18 ([249513f1](https://github.com/electron-userland/electron-forge/commit/249513f1))
  - upgrade @babel/register to 7.13.16 ([16772f4b](https://github.com/electron-userland/electron-forge/commit/16772f4b))
  - upgrade @babel/preset-env to 7.14.2 ([ae6b91cd](https://github.com/electron-userland/electron-forge/commit/ae6b91cd))
  - upgrade @babel/core to 7.14.3 ([53ab5f94](https://github.com/electron-userland/electron-forge/commit/53ab5f94))
  - upgrade @babel/cli to 7.14.3 ([3bfe8176](https://github.com/electron-userland/electron-forge/commit/3bfe8176))
  - update typescript-eslint packages for typescript template ([18e30359](https://github.com/electron-userland/electron-forge/commit/18e30359))
  - upgrade @types/node to 14.14.33 ([25e48545](https://github.com/electron-userland/electron-forge/commit/25e48545))
  - upgrade typedoc to 0.20.30 ([4a679aca](https://github.com/electron-userland/electron-forge/commit/4a679aca))
  - upgrade mocha to 8.3.1 ([53d7413c](https://github.com/electron-userland/electron-forge/commit/53d7413c))
  - upgrade eslint-plugin-mocha to 8.1.0 ([8e6a87b1](https://github.com/electron-userland/electron-forge/commit/8e6a87b1))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.17.0 ([5236ac37](https://github.com/electron-userland/electron-forge/commit/5236ac37))
  - upgrade @types/webpack-merge to ^5.0.0 ([f3b6488d](https://github.com/electron-userland/electron-forge/commit/f3b6488d))
  - upgrade @types/sinon to 9.0.11 ([29b613e4](https://github.com/electron-userland/electron-forge/commit/29b613e4))
  - upgrade @types/node to 14.14.32 ([f293d773](https://github.com/electron-userland/electron-forge/commit/f293d773))
  - upgrade @babel/preset-env to 7.13.10 ([d0eafade](https://github.com/electron-userland/electron-forge/commit/d0eafade))
  - upgrade @babel/core to 7.13.10 ([a2940d32](https://github.com/electron-userland/electron-forge/commit/a2940d32))
  - upgrade @babel/cli to 7.13.10 ([a3b12994](https://github.com/electron-userland/electron-forge/commit/a3b12994))
  - upgrade husky to ^5.1.3 ([b987f85d](https://github.com/electron-userland/electron-forge/commit/b987f85d))
  - upgrade typedoc to ^0.20.29 ([159be54f](https://github.com/electron-userland/electron-forge/commit/159be54f))
  - upgrade sinon to 9.2.4 ([8be991ac](https://github.com/electron-userland/electron-forge/commit/8be991ac))
  - upgrade nodemon to 2.0.7 ([32df8518](https://github.com/electron-userland/electron-forge/commit/32df8518))
  - upgrade mocha to 8.3.0 ([a11ad79b](https://github.com/electron-userland/electron-forge/commit/a11ad79b))
  - upgrade lint-staged to 10.5.4 ([7ffab319](https://github.com/electron-userland/electron-forge/commit/7ffab319))
  - upgrade chai to ^4.3.3 ([bd14bf0a](https://github.com/electron-userland/electron-forge/commit/bd14bf0a))
  - upgrade globby to 11.0.2 ([8a0a61d7](https://github.com/electron-userland/electron-forge/commit/8a0a61d7))
  - upgrade eslint to 7.21.0 ([7096fb8d](https://github.com/electron-userland/electron-forge/commit/7096fb8d))
  - upgrade commitizen to 4.2.3 ([0d9a26f4](https://github.com/electron-userland/electron-forge/commit/0d9a26f4))
  - upgrade chai to 4.3.3 ([1d4df1bc](https://github.com/electron-userland/electron-forge/commit/1d4df1bc))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.16.1 ([988fcdc6](https://github.com/electron-userland/electron-forge/commit/988fcdc6))
  - upgrade @types/webpack-dev-middleware to ^4.1.0 ([ea7cce95](https://github.com/electron-userland/electron-forge/commit/ea7cce95))
  - upgrade @types/node-fetch to 2.5.8 ([3e9b516b](https://github.com/electron-userland/electron-forge/commit/3e9b516b))
  - upgrade @types/node to 14.14.31 ([34c8c426](https://github.com/electron-userland/electron-forge/commit/34c8c426))
  - upgrade @types/mocha to 8.2.1 ([c93c3aa2](https://github.com/electron-userland/electron-forge/commit/c93c3aa2))
  - upgrade @types/lodash to 4.14.168 ([9d92b736](https://github.com/electron-userland/electron-forge/commit/9d92b736))
  - upgrade @types/fs-extra to 9.0.8 ([443dec6a](https://github.com/electron-userland/electron-forge/commit/443dec6a))
  - upgrade @types/express to 4.17.11 ([33cf1dc6](https://github.com/electron-userland/electron-forge/commit/33cf1dc6))
  - upgrade @types/chai to 4.2.15 ([03210cd5](https://github.com/electron-userland/electron-forge/commit/03210cd5))
  - upgrade @babel/register to 7.13.8 ([67617440](https://github.com/electron-userland/electron-forge/commit/67617440))
  - upgrade @babel/preset-typescript to 7.13.0 ([60405f09](https://github.com/electron-userland/electron-forge/commit/60405f09))
  - upgrade @babel/preset-env to 7.13.9 ([f13ee5c0](https://github.com/electron-userland/electron-forge/commit/f13ee5c0))
  - upgrade @babel/plugin-proposal-class-properties to 7.13.0 ([cabf671b](https://github.com/electron-userland/electron-forge/commit/cabf671b))
  - upgrade @babel/core to 7.13.8 ([8f412408](https://github.com/electron-userland/electron-forge/commit/8f412408))
  - upgrade @babel/cli to 7.13.0 ([e23f2876](https://github.com/electron-userland/electron-forge/commit/e23f2876))
  - bump @types/node from 14.14.14 to 14.14.16 (#2110) ([646c159d](https://github.com/electron-userland/electron-forge/commit/646c159d))
  - bump @types/lodash from 4.14.165 to 4.14.166 ([27fcade7](https://github.com/electron-userland/electron-forge/commit/27fcade7))
  - bump @types/fs-extra from 9.0.5 to 9.0.6 (#2112) ([41f6811b](https://github.com/electron-userland/electron-forge/commit/41f6811b))
  - bump @types/sinon from 9.0.9 to 9.0.10 ([a09762a4](https://github.com/electron-userland/electron-forge/commit/a09762a4))
  - bump @typescript-eslint/eslint-plugin ([ada51b6f](https://github.com/electron-userland/electron-forge/commit/ada51b6f))
  - bump eslint from 7.15.0 to 7.16.0 (#2102) ([78a980d5](https://github.com/electron-userland/electron-forge/commit/78a980d5))
  - bump @typescript-eslint/parser from 4.10.0 to 4.11.0 ([d9a512f0](https://github.com/electron-userland/electron-forge/commit/d9a512f0))
  - bump @babel/preset-env from 7.12.10 to 7.12.11 (#2095) ([678e63c6](https://github.com/electron-userland/electron-forge/commit/678e63c6))
  - bump @types/node from 14.14.13 to 14.14.14 (#2094) ([cccf0e8b](https://github.com/electron-userland/electron-forge/commit/cccf0e8b))
  - bump @typescript-eslint/eslint-plugin from 4.9.1 to 4.10.0 (#2093) ([30217375](https://github.com/electron-userland/electron-forge/commit/30217375))
  - bump @typescript-eslint/parser from 4.9.1 to 4.10.0 ([2c9ac0fc](https://github.com/electron-userland/electron-forge/commit/2c9ac0fc))
  - bump husky from 4.3.5 to 4.3.6 ([2ceda33a](https://github.com/electron-userland/electron-forge/commit/2ceda33a))
  - bump @types/node from 14.14.12 to 14.14.13 (#2085) ([7d5f7ac6](https://github.com/electron-userland/electron-forge/commit/7d5f7ac6))
  - bump sinon from 9.2.1 to 9.2.2 (#2084) ([932da126](https://github.com/electron-userland/electron-forge/commit/932da126))
  - bump @types/fs-extra from 9.0.4 to 9.0.5 ([286f96ac](https://github.com/electron-userland/electron-forge/commit/286f96ac))
  - bump @types/node from 14.14.11 to 14.14.12 (#2079) ([268699bb](https://github.com/electron-userland/electron-forge/commit/268699bb))
  - bump @babel/core from 7.12.9 to 7.12.10 ([201c1377](https://github.com/electron-userland/electron-forge/commit/201c1377))
  - bump @babel/register from 7.12.1 to 7.12.10 ([7789e9c1](https://github.com/electron-userland/electron-forge/commit/7789e9c1))
  - bump @babel/preset-env from 7.12.7 to 7.12.10 (#2076) ([0b0efaca](https://github.com/electron-userland/electron-forge/commit/0b0efaca))
  - bump @babel/cli from 7.12.8 to 7.12.10 ([17e20b68](https://github.com/electron-userland/electron-forge/commit/17e20b68))
  - upgrade @typescript-eslint/eslint-plugin to ^4.9.1 ([ee25aede](https://github.com/electron-userland/electron-forge/commit/ee25aede))
  - upgrade ts-node to 9.1.1 ([9e87385b](https://github.com/electron-userland/electron-forge/commit/9e87385b))
  - upgrade husky to 4.3.5 ([5c90c0e5](https://github.com/electron-userland/electron-forge/commit/5c90c0e5))
  - upgrade @types/node to 14.14.11 ([1e47c39b](https://github.com/electron-userland/electron-forge/commit/1e47c39b))
  - upgrade @types/mocha to 8.2.0 ([0ef47768](https://github.com/electron-userland/electron-forge/commit/0ef47768))
  - bump @typescript-eslint/parser from 4.9.0 to 4.9.1 ([d70f444c](https://github.com/electron-userland/electron-forge/commit/d70f444c))
  - bump eslint from 7.14.0 to 7.15.0 ([c81945dd](https://github.com/electron-userland/electron-forge/commit/c81945dd))
  - upgrade lint-staged to 10.5.3 ([a1d72ba9](https://github.com/electron-userland/electron-forge/commit/a1d72ba9))
  - bump ts-node from 9.0.0 to 9.1.0 ([dc36029c](https://github.com/electron-userland/electron-forge/commit/dc36029c))
  - upgrade cross-env to 7.0.3 ([b53cf670](https://github.com/electron-userland/electron-forge/commit/b53cf670))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.9.0 ([7e1df029](https://github.com/electron-userland/electron-forge/commit/7e1df029))
  - bump @types/node from 14.14.9 to 14.14.10 (#2058) ([9c6f7d36](https://github.com/electron-userland/electron-forge/commit/9c6f7d36))
  - bump @babel/core from 7.12.8 to 7.12.9 (#2057) ([5e7c22df](https://github.com/electron-userland/electron-forge/commit/5e7c22df))
  - upgrade lint-staged to 10.5.2 ([7e3227b4](https://github.com/electron-userland/electron-forge/commit/7e3227b4))
  - upgrade fetch-mock to 9.11.0 ([d7897f43](https://github.com/electron-userland/electron-forge/commit/d7897f43))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.8.2 ([6844f11e](https://github.com/electron-userland/electron-forge/commit/6844f11e))
  - upgrade @types/sinon to 9.0.9 ([a2b8abff](https://github.com/electron-userland/electron-forge/commit/a2b8abff))
  - upgrade @babel/preset-env to 7.12.7 ([11f6f8ed](https://github.com/electron-userland/electron-forge/commit/11f6f8ed))
  - upgrade @babel/core to 7.12.8 ([48735ffe](https://github.com/electron-userland/electron-forge/commit/48735ffe))
  - upgrade @babel/cli to 7.12.8 ([b6a7df6f](https://github.com/electron-userland/electron-forge/commit/b6a7df6f))
  - bump @babel/preset-typescript from 7.12.1 to 7.12.7 (#2050) ([2e46aaaa](https://github.com/electron-userland/electron-forge/commit/2e46aaaa))
  - bump eslint from 7.13.0 to 7.14.0 ([3b2259f4](https://github.com/electron-userland/electron-forge/commit/3b2259f4))
  - bump @types/node from 14.14.8 to 14.14.9 (#2047) ([001ff243](https://github.com/electron-userland/electron-forge/commit/001ff243))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.8.1 ([faccc69b](https://github.com/electron-userland/electron-forge/commit/faccc69b))
  - upgrade @types/node to 14.14.8 ([868ca145](https://github.com/electron-userland/electron-forge/commit/868ca145))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.8.0 ([770dd11b](https://github.com/electron-userland/electron-forge/commit/770dd11b))
  - upgrade @types/minimist to 1.2.1 ([50b07fbb](https://github.com/electron-userland/electron-forge/commit/50b07fbb))
  - upgrade @types/fs-extra to 9.0.4 ([fe2fe457](https://github.com/electron-userland/electron-forge/commit/fe2fe457))
  - bump @types/mocha from 8.0.3 to 8.0.4 ([b2961cfa](https://github.com/electron-userland/electron-forge/commit/b2961cfa))
  - bump @types/express from 4.17.8 to 4.17.9 (#2033) ([32091854](https://github.com/electron-userland/electron-forge/commit/32091854))
  - bump @typescript-eslint/parser from 4.6.1 to 4.7.0 ([9d1264da](https://github.com/electron-userland/electron-forge/commit/9d1264da))
  - bump fork-ts-checker-webpack-plugin ([a36e63b6](https://github.com/electron-userland/electron-forge/commit/a36e63b6))
  - bump @types/node from 14.14.6 to 14.14.7 (#2028) ([edaec935](https://github.com/electron-userland/electron-forge/commit/edaec935))
  - upgrade mocha to 8.2.1 ([c183deca](https://github.com/electron-userland/electron-forge/commit/c183deca))
  - upgrade lint-staged to 10.5.1 ([c13c5aa5](https://github.com/electron-userland/electron-forge/commit/c13c5aa5))
  - upgrade eslint-config-airbnb-base to 14.2.1 ([e1065df2](https://github.com/electron-userland/electron-forge/commit/e1065df2))
  - upgrade eslint to 7.13.0 ([47d8281a](https://github.com/electron-userland/electron-forge/commit/47d8281a))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.6.1 ([77c16bc2](https://github.com/electron-userland/electron-forge/commit/77c16bc2))
  - upgrade @types/lodash to 4.14.165 ([ec44c020](https://github.com/electron-userland/electron-forge/commit/ec44c020))
  - upgrade @types/fs-extra to 9.0.3 ([dce3dcfb](https://github.com/electron-userland/electron-forge/commit/dce3dcfb))
  - bump style-loader in /packages/template/webpack/tmpl ([d12f3038](https://github.com/electron-userland/electron-forge/commit/d12f3038))
  - bump style-loader ([654d10fd](https://github.com/electron-userland/electron-forge/commit/654d10fd))
  - bump css-loader ([74455a8c](https://github.com/electron-userland/electron-forge/commit/74455a8c))
  - bump css-loader in /packages/template/webpack/tmpl ([fed82389](https://github.com/electron-userland/electron-forge/commit/fed82389))
  - upgrade typescript to 4.0.5 ([0ecb061f](https://github.com/electron-userland/electron-forge/commit/0ecb061f))
  - upgrade sinon to 9.2.1 ([146a745c](https://github.com/electron-userland/electron-forge/commit/146a745c))
  - upgrade lint-staged to 10.5.0 ([f0d506b0](https://github.com/electron-userland/electron-forge/commit/f0d506b0))
  - upgrade eslint to 7.12.1 ([e51a61e6](https://github.com/electron-userland/electron-forge/commit/e51a61e6))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.6.0 ([4b99c35f](https://github.com/electron-userland/electron-forge/commit/4b99c35f))
  - upgrade @types/webpack to 4.41.24 ([9376bf9c](https://github.com/electron-userland/electron-forge/commit/9376bf9c))
  - upgrade @types/node to 14.14.6 ([587d18cf](https://github.com/electron-userland/electron-forge/commit/587d18cf))
  - upgrade @types/lodash to 4.14.163 ([cb6dd659](https://github.com/electron-userland/electron-forge/commit/cb6dd659))
  - bump eslint from 7.11.0 to 7.12.0 ([c3bc236d](https://github.com/electron-userland/electron-forge/commit/c3bc236d))
  - bump @types/node from 14.14.0 to 14.14.2 (#2004) ([3aa2f8ae](https://github.com/electron-userland/electron-forge/commit/3aa2f8ae))
- **dependabot:** ignore other problematic packages ([051e4f14](https://github.com/electron-userland/electron-forge/commit/051e4f14))
- add @types/webpack to mass update dependencies blacklist ([1abf5e4d](https://github.com/electron-userland/electron-forge/commit/1abf5e4d))
- add cross-zip & webpack to the do not upgrade list ([5f7fad30](https://github.com/electron-userland/electron-forge/commit/5f7fad30))

##### Chores

- add more ignored packages ([da7ac6fa](https://github.com/electron-userland/electron-forge/commit/da7ac6fa))
- forgot to block html-webpack-plugin v5 ([730b7127](https://github.com/electron-userland/electron-forge/commit/730b7127))
- sync dependabot ignore with update-dependencies ignore ([71173621](https://github.com/electron-userland/electron-forge/commit/71173621))
- upgrade transitive dependencies ([a92f6af8](https://github.com/electron-userland/electron-forge/commit/a92f6af8))
- ignore html-webpack-plugin & open in the update dependency script ([38c75236](https://github.com/electron-userland/electron-forge/commit/38c75236))
- prevent TypeScript from updating the minor version automatically ([912fa65e](https://github.com/electron-userland/electron-forge/commit/912fa65e))
- **template-typescript:** add test script ([191781ff](https://github.com/electron-userland/electron-forge/commit/191781ff))
- **deps:** ignore webpack 5.x auto-upgrade since it needs work ([9c01a08e](https://github.com/electron-userland/electron-forge/commit/9c01a08e))
- **plugin-webpack:** fix test script (#2015) ([903a43cd](https://github.com/electron-userland/electron-forge/commit/903a43cd))

##### Continuous Integration

- pin Ubuntu 18.04 for slow tests, not fast tests ([fe649cf5](https://github.com/electron-userland/electron-forge/commit/fe649cf5))
- pin Ubuntu to 18.04 for the time being ([ac186b2b](https://github.com/electron-userland/electron-forge/commit/ac186b2b))
- use dependabolt v2.1.3 (#2031) ([75bbd22c](https://github.com/electron-userland/electron-forge/commit/75bbd22c))

##### Documentation Changes

- advertise the Discord server (#2181) ([5ca1dd9d](https://github.com/electron-userland/electron-forge/commit/5ca1dd9d))
- **async-ora:** clarify use with DEBUG ([b63f4a02](https://github.com/electron-userland/electron-forge/commit/b63f4a02))

##### Bug Fixes

- **core:** better error detection for electron-prebuilt-compile (#2268) ([fdc82117](https://github.com/electron-userland/electron-forge/commit/fdc82117))
- **template/typescript-webpack:**
  - magic constant is a string w/comments about what it's for (#2166) ([f15b5c7a](https://github.com/electron-userland/electron-forge/commit/f15b5c7a))
  - add ts/tsx to known eslint-plugin-import extensions (#2139) ([90f122c2](https://github.com/electron-userland/electron-forge/commit/90f122c2))
- **plugin-webpack:** correctly define the asset relocator base dir (#2022) ([390219fd](https://github.com/electron-userland/electron-forge/commit/390219fd))
- **template-typescript:** add eslint-plugin-import/typescript rules (#2048) ([c27ca4bf](https://github.com/electron-userland/electron-forge/commit/c27ca4bf))
- **cli:** don't hardcode the minimum required Node version (#2003) ([704db4b1](https://github.com/electron-userland/electron-forge/commit/704db4b1))

#### [6.0.0-beta.54](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.54) (2020-10-20)

##### Build System / Dependencies

- **deps:**
  - upgrade transitive dependencies ([1c1352aa](https://github.com/electron-userland/electron-forge/commit/1c1352aa))
  - upgrade pretty-ms to 7.0.1 ([08bddc31](https://github.com/electron-userland/electron-forge/commit/08bddc31))
  - upgrade open to 7.3.0 ([1cdd4931](https://github.com/electron-userland/electron-forge/commit/1cdd4931))
  - upgrade html-webpack-plugin to 4.5.0 ([ae282da7](https://github.com/electron-userland/electron-forge/commit/ae282da7))
  - upgrade electron-wix-msi to 3.0.4 ([d4c920c3](https://github.com/electron-userland/electron-forge/commit/d4c920c3))
  - upgrade electron-rebuild to 2.3.1 ([9c1b3a65](https://github.com/electron-userland/electron-forge/commit/9c1b3a65))
  - upgrade debug to 4.2.0 ([166e1a3a](https://github.com/electron-userland/electron-forge/commit/166e1a3a))
  - upgrade aws-sdk to 2.775.0 ([4acb8116](https://github.com/electron-userland/electron-forge/commit/4acb8116))
  - upgrade @octokit/core to 3.1.3 ([79553a78](https://github.com/electron-userland/electron-forge/commit/79553a78))
  - bump codecov/codecov-action from v1.0.13 to v1.0.14 ([76e6f967](https://github.com/electron-userland/electron-forge/commit/76e6f967))
  - bump electron-wix-msi from 3.0.0 to 3.0.2 (#1975) ([b1b762cd](https://github.com/electron-userland/electron-forge/commit/b1b762cd))
  - bump webpack from 4.44.1 to 4.44.2 (#1973) ([bad313a1](https://github.com/electron-userland/electron-forge/commit/bad313a1))
  - bump @doyensec/electronegativity from 1.6.0 to 1.7.0 (#1965) ([266eeb6a](https://github.com/electron-userland/electron-forge/commit/266eeb6a))
  - bump @octokit/rest from 18.0.5 to 18.0.6 (#1966) ([9fb889ae](https://github.com/electron-userland/electron-forge/commit/9fb889ae))
  - bump webpack-merge from 5.1.3 to 5.1.4 (#1957) ([4f7da840](https://github.com/electron-userland/electron-forge/commit/4f7da840))
  - bump electron-rebuild from 2.0.2 to 2.0.3 (#1959) ([6be0ac05](https://github.com/electron-userland/electron-forge/commit/6be0ac05))
  - bump @octokit/types from 5.4.1 to 5.5.0 (#1961) ([3d1c5406](https://github.com/electron-userland/electron-forge/commit/3d1c5406))
  - bump xterm from 4.8.1 to 4.9.0 (#1956) ([be2deb8d](https://github.com/electron-userland/electron-forge/commit/be2deb8d))
  - upgrade electron-rebuild to 2.0.2 ([c8714a0c](https://github.com/electron-userland/electron-forge/commit/c8714a0c))
  - upgrade transitive dependencies ([7ebac11a](https://github.com/electron-userland/electron-forge/commit/7ebac11a))
  - upgrade aws-sdk to 2.747.0 ([876eae44](https://github.com/electron-userland/electron-forge/commit/876eae44))
  - upgrade ora to 5.1.0 ([124a8bc6](https://github.com/electron-userland/electron-forge/commit/124a8bc6))
  - upgrade node-fetch to 2.6.1 ([c6694efc](https://github.com/electron-userland/electron-forge/commit/c6694efc))
  - upgrade @octokit/rest to 18.0.5 ([645dc469](https://github.com/electron-userland/electron-forge/commit/645dc469))
  - bump webpack-merge from 5.1.2 to 5.1.3 (#1943) ([7f2e00f0](https://github.com/electron-userland/electron-forge/commit/7f2e00f0))
  - bump open from 7.2.0 to 7.2.1 (#1938) ([fde5435f](https://github.com/electron-userland/electron-forge/commit/fde5435f))
  - bump html-webpack-plugin from 4.3.0 to 4.4.1 (#1940) ([6639803c](https://github.com/electron-userland/electron-forge/commit/6639803c))
  - bump @octokit/rest from 18.0.3 to 18.0.4 (#1933) ([ef2bf1fe](https://github.com/electron-userland/electron-forge/commit/ef2bf1fe))
- add script to batch update dependencies ([ca0035f8](https://github.com/electron-userland/electron-forge/commit/ca0035f8))
- **deps-dev:**
  - upgrade typescript to 4.0.3 ([9cf56e4c](https://github.com/electron-userland/electron-forge/commit/9cf56e4c))
  - upgrade typedoc to 0.19.2 ([bdf1c5dd](https://github.com/electron-userland/electron-forge/commit/bdf1c5dd))
  - upgrade sinon to 9.2.0 ([840093e6](https://github.com/electron-userland/electron-forge/commit/840093e6))
  - upgrade nodemon to 2.0.6 ([b6cbc7c3](https://github.com/electron-userland/electron-forge/commit/b6cbc7c3))
  - upgrade mocha to 8.2.0 ([2cf9ddeb](https://github.com/electron-userland/electron-forge/commit/2cf9ddeb))
  - upgrade lint-staged to 10.4.2 ([9851181b](https://github.com/electron-userland/electron-forge/commit/9851181b))
  - upgrade eslint-plugin-import to 2.22.1 ([7866c5b0](https://github.com/electron-userland/electron-forge/commit/7866c5b0))
  - upgrade eslint to 7.11.0 ([2018a93b](https://github.com/electron-userland/electron-forge/commit/2018a93b))
  - upgrade commitizen to 4.2.2 ([f4336fdc](https://github.com/electron-userland/electron-forge/commit/f4336fdc))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 4.5.0 ([26db59ae](https://github.com/electron-userland/electron-forge/commit/26db59ae))
  - upgrade @types/webpack to 4.41.23 ([b344ea1e](https://github.com/electron-userland/electron-forge/commit/b344ea1e))
  - upgrade @types/username to ^5.0.0 ([aaa3ef1a](https://github.com/electron-userland/electron-forge/commit/aaa3ef1a))
  - upgrade @types/sinon to 9.0.8 ([03a0d210](https://github.com/electron-userland/electron-forge/commit/03a0d210))
  - upgrade @types/lodash to 4.14.162 ([2f397255](https://github.com/electron-userland/electron-forge/commit/2f397255))
  - upgrade @types/html-minifier-terser to 5.1.1 ([c04f4784](https://github.com/electron-userland/electron-forge/commit/c04f4784))
  - upgrade @types/fs-extra to 9.0.2 ([9411c872](https://github.com/electron-userland/electron-forge/commit/9411c872))
  - upgrade @types/chai to 4.2.14 ([29d6f4a5](https://github.com/electron-userland/electron-forge/commit/29d6f4a5))
  - upgrade @babel/register to 7.12.1 ([87ca1d72](https://github.com/electron-userland/electron-forge/commit/87ca1d72))
  - upgrade @babel/preset-typescript to 7.12.1 ([7c9bb970](https://github.com/electron-userland/electron-forge/commit/7c9bb970))
  - upgrade @babel/preset-env to 7.12.1 ([da77c360](https://github.com/electron-userland/electron-forge/commit/da77c360))
  - upgrade @babel/plugin-proposal-class-properties to 7.12.1 ([3ae646be](https://github.com/electron-userland/electron-forge/commit/3ae646be))
  - upgrade @babel/core to 7.12.3 ([8814a2ff](https://github.com/electron-userland/electron-forge/commit/8814a2ff))
  - upgrade @babel/cli to 7.12.1 ([22981839](https://github.com/electron-userland/electron-forge/commit/22981839))
  - bump actions/setup-node from v2.1.1 to v2.1.2 (#1986) ([9ae5f75e](https://github.com/electron-userland/electron-forge/commit/9ae5f75e))
  - bump @types/node from 14.10.3 to 14.11.1 (#1974) ([56a52668](https://github.com/electron-userland/electron-forge/commit/56a52668))
  - bump lint-staged from 10.3.0 to 10.4.0 ([3aebc3e2](https://github.com/electron-userland/electron-forge/commit/3aebc3e2))
  - bump @types/node from 14.10.2 to 14.10.3 (#1971) ([4f3f62d7](https://github.com/electron-userland/electron-forge/commit/4f3f62d7))
  - bump @types/node from 14.10.1 to 14.10.2 (#1970) ([f5ed0c96](https://github.com/electron-userland/electron-forge/commit/f5ed0c96))
  - bump @types/semver from 7.3.3 to 7.3.4 ([41cf57d4](https://github.com/electron-userland/electron-forge/commit/41cf57d4))
  - upgrade eslint to 7.9.0 ([efd823ac](https://github.com/electron-userland/electron-forge/commit/efd823ac))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 4.1.1 ([600b01ce](https://github.com/electron-userland/electron-forge/commit/600b01ce))
  - bump @types/node from 14.6.4 to 14.10.0 (#1960) ([31d0bfd9](https://github.com/electron-userland/electron-forge/commit/31d0bfd9))
  - bump @typescript-eslint/eslint-plugin ([a21d9d3f](https://github.com/electron-userland/electron-forge/commit/a21d9d3f))
  - bump @typescript-eslint/parser from 4.0.1 to 4.1.0 ([31dbe544](https://github.com/electron-userland/electron-forge/commit/31dbe544))
  - bump husky from 4.2.5 to 4.3.0 ([1f9cde52](https://github.com/electron-userland/electron-forge/commit/1f9cde52))
  - upgrade @babel/{preset-env,register} to 7.11.5 ([8a4866d2](https://github.com/electron-userland/electron-forge/commit/8a4866d2))
  - upgrade @babel/{cli,core} to 7.11.6 ([cd2aa984](https://github.com/electron-userland/electron-forge/commit/cd2aa984))
  - upgrade typedoc to 0.19.1 ([90071f73](https://github.com/electron-userland/electron-forge/commit/90071f73))
  - upgrade lint-staged to 10.3.0 ([68d400e0](https://github.com/electron-userland/electron-forge/commit/68d400e0))
  - upgrade eslint to 7.8.1 ([690ffff6](https://github.com/electron-userland/electron-forge/commit/690ffff6))
  - upgrade babel-plugin-source-map-support to 2.1.3 ([9b143ea1](https://github.com/electron-userland/electron-forge/commit/9b143ea1))
  - upgrade @types/webpack to 4.41.22 ([f68abbeb](https://github.com/electron-userland/electron-forge/commit/f68abbeb))
  - upgrade @types/node to 14.6.4 ([adefaa5f](https://github.com/electron-userland/electron-forge/commit/adefaa5f))
  - upgrade @types/fetch-mock to 7.3.3 ([fd526250](https://github.com/electron-userland/electron-forge/commit/fd526250))
  - upgrade @types/express to 4.17.8 ([e9d84618](https://github.com/electron-userland/electron-forge/commit/e9d84618))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to ^4.0.1 ([0b631ed2](https://github.com/electron-userland/electron-forge/commit/0b631ed2))
  - bump @types/lodash from 4.14.160 to 4.14.161 ([ee5735dc](https://github.com/electron-userland/electron-forge/commit/ee5735dc))
  - bump @typescript-eslint/eslint-plugin ([5542b8ec](https://github.com/electron-userland/electron-forge/commit/5542b8ec))
  - bump @typescript-eslint/parser ([ea406744](https://github.com/electron-userland/electron-forge/commit/ea406744))
  - bump mocha from 8.1.2 to 8.1.3 (#1937) ([06ddc78e](https://github.com/electron-userland/electron-forge/commit/06ddc78e))
  - bump typedoc from 0.18.0 to 0.19.0 (#1939) ([13b53482](https://github.com/electron-userland/electron-forge/commit/13b53482))
  - bump @types/node from 14.6.0 to 14.6.1 ([e47f3183](https://github.com/electron-userland/electron-forge/commit/e47f3183))
  - bump lint-staged from 10.2.12 to 10.2.13 ([6d6db23a](https://github.com/electron-userland/electron-forge/commit/6d6db23a))
  - bump mocha from 8.1.1 to 8.1.2 (#1931) ([a94777d3](https://github.com/electron-userland/electron-forge/commit/a94777d3))
  - bump commitizen from 4.2.0 to 4.2.1 ([74a2a428](https://github.com/electron-userland/electron-forge/commit/74a2a428))
- **ci:**
  - fix grep command ([38b3dca4](https://github.com/electron-userland/electron-forge/commit/38b3dca4))
  - remove opensuse sources ([3f7f80e7](https://github.com/electron-userland/electron-forge/commit/3f7f80e7))

##### Bug Fixes

- **publisher-github:**
  - use new @octokit .auth property (#1989) ([dae97c40](https://github.com/electron-userland/electron-forge/commit/dae97c40))
  - don't reexport Octokit type (#1962) ([af79fa1c](https://github.com/electron-userland/electron-forge/commit/af79fa1c))
- **core:** init should install the latest caret version of Forge (#1963) ([b1693f09](https://github.com/electron-userland/electron-forge/commit/b1693f09))

##### Tests

- fix deletes with TypeScript 4.0 ([5f0266dd](https://github.com/electron-userland/electron-forge/commit/5f0266dd))

#### [6.0.0-beta.53](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.53) (2020-08-25)

##### Build System / Dependencies

- upgrade transitive dependencies ([1e62bb0b](https://github.com/electron-userland/electron-forge/commit/1e62bb0b))
- refactor GitHub Action jobs (#1875) ([4afa3dca](https://github.com/electron-userland/electron-forge/commit/4afa3dca))
- use the rolling v2 branch for dependabolt ([0793b20b](https://github.com/electron-userland/electron-forge/commit/0793b20b))
- add GitHub Actions to Dependabot for real this time ([01d2d393](https://github.com/electron-userland/electron-forge/commit/01d2d393))
- add Dependabot config (#1811) ([765e8f25](https://github.com/electron-userland/electron-forge/commit/765e8f25))
- **deps:**
  - upgrade aws-sdk to 2.739.0 ([57915f85](https://github.com/electron-userland/electron-forge/commit/57915f85))
  - upgrade electron-rebuild to 2.0.1 ([1b4a68da](https://github.com/electron-userland/electron-forge/commit/1b4a68da))
  - upgrade webpack-merge to 5.1.2 ([3a6c6f04](https://github.com/electron-userland/electron-forge/commit/3a6c6f04))
  - upgrade electron-rebuild to ^2.0.0 ([5924aef4](https://github.com/electron-userland/electron-forge/commit/5924aef4))
  - upgrade electron-packager to 15.1.0 ([ccac56e2](https://github.com/electron-userland/electron-forge/commit/ccac56e2))
  - bump open from 7.1.0 to 7.2.0 (#1927) ([2821473b](https://github.com/electron-userland/electron-forge/commit/2821473b))
  - bump @octokit/types from 5.4.0 to 5.4.1 (#1925) ([6bfa4ab9](https://github.com/electron-userland/electron-forge/commit/6bfa4ab9))
  - bump codecov/codecov-action from v1.0.12 to v1.0.13 ([9da35377](https://github.com/electron-userland/electron-forge/commit/9da35377))
  - bump lodash from 4.17.19 to 4.17.20 (#1917) ([a8db2000](https://github.com/electron-userland/electron-forge/commit/a8db2000))
  - bump find-up from 4.1.0 to 5.0.0 (#1902) ([174baa26](https://github.com/electron-userland/electron-forge/commit/174baa26))
  - upgrade @octokit/types to 5.4.0 ([a311e323](https://github.com/electron-userland/electron-forge/commit/a311e323))
  - upgrade ora to ^5.0.0 ([4d8356a2](https://github.com/electron-userland/electron-forge/commit/4d8356a2))
  - upgrade @octokit/types to 5.3.0 ([5e2bdd81](https://github.com/electron-userland/electron-forge/commit/5e2bdd81))
  - upgrade electron-wix-msi to ^3.0.0 ([fafe0d26](https://github.com/electron-userland/electron-forge/commit/fafe0d26))
  - upgrade ora to 4.1.0 ([387d7224](https://github.com/electron-userland/electron-forge/commit/387d7224))
  - bump @octokit/core from 3.1.1 to 3.1.2 (#1886) ([6ae3d5e8](https://github.com/electron-userland/electron-forge/commit/6ae3d5e8))
  - bump @octokit/types from 5.2.0 to 5.2.1 (#1887) ([9e93f3cc](https://github.com/electron-userland/electron-forge/commit/9e93f3cc))
  - bump webpack-merge from 5.0.9 to 5.1.1 (#1883) ([b0ca86af](https://github.com/electron-userland/electron-forge/commit/b0ca86af))
  - update codecov/codecov-action requirement to v1.0.12 (#1880) ([0be4195a](https://github.com/electron-userland/electron-forge/commit/0be4195a))
  - update actions/setup-node requirement to v2.1.1 (#1881) ([2172d157](https://github.com/electron-userland/electron-forge/commit/2172d157))
  - upgrade webpack to 4.44.1 ([3263c7db](https://github.com/electron-userland/electron-forge/commit/3263c7db))
  - upgrade aws-sdk to 2.720.0 ([65f3e05b](https://github.com/electron-userland/electron-forge/commit/65f3e05b))
  - upgrade webpack to 4.44.0 ([16ff101d](https://github.com/electron-userland/electron-forge/commit/16ff101d))
  - upgrade @octokit/rest to 18.0.3 ([88940331](https://github.com/electron-userland/electron-forge/commit/88940331))
  - upgrade transitive dependencies ([ab893497](https://github.com/electron-userland/electron-forge/commit/ab893497))
  - bump electron-installer-redhat from 3.1.0 to 3.2.0 (#1866) ([7fe7e6f8](https://github.com/electron-userland/electron-forge/commit/7fe7e6f8))
  - bump @octokit/types from 5.1.0 to ^5.1.1 (#1861) ([ee889bf6](https://github.com/electron-userland/electron-forge/commit/ee889bf6))
  - bump codecov/codecov-action from v1.0.11 to v1.0.12 ([c18c3dea](https://github.com/electron-userland/electron-forge/commit/c18c3dea))
  - bump inquirer from 7.3.2 to 7.3.3 (#1860) ([889a63b9](https://github.com/electron-userland/electron-forge/commit/889a63b9))
  - bump actions/setup-node from v2.1.0 to v2.1.1 ([027e4320](https://github.com/electron-userland/electron-forge/commit/027e4320))
  - bump ora from 4.0.4 to 4.0.5 (#1850) ([307a1631](https://github.com/electron-userland/electron-forge/commit/307a1631))
  - bump open from 7.0.4 to 7.1.0 (#1849) ([ec41d582](https://github.com/electron-userland/electron-forge/commit/ec41d582))
  - bump @octokit/rest from 18.0.0 to 18.0.1 (#1842) ([5d9b8f15](https://github.com/electron-userland/electron-forge/commit/5d9b8f15))
  - bump @octokit/core from 3.1.0 to 3.1.1 (#1844) ([f051a76e](https://github.com/electron-userland/electron-forge/commit/f051a76e))
  - bump @octokit/types from 5.0.1 to 5.1.0 (#1841) ([e106ca03](https://github.com/electron-userland/electron-forge/commit/e106ca03))
  - upgrade aws-sdk to 2.713.0 ([c8b65bb8](https://github.com/electron-userland/electron-forge/commit/c8b65bb8))
  - upgrade inquirer to 7.3.2 ([35ebc8ca](https://github.com/electron-userland/electron-forge/commit/35ebc8ca))
  - bump xterm from 4.7.0 to 4.8.1 (#1834) ([2a2fa4fc](https://github.com/electron-userland/electron-forge/commit/2a2fa4fc))
  - bump webpack-merge from 5.0.8 to 5.0.9 (#1830) ([b30945c7](https://github.com/electron-userland/electron-forge/commit/b30945c7))
  - bump lodash from 4.17.15 to 4.17.19 (#1829) ([f7cb5a4e](https://github.com/electron-userland/electron-forge/commit/f7cb5a4e))
  - bump webpack-merge from 4.2.2 to 5.0.8 (#1827) ([d0258786](https://github.com/electron-userland/electron-forge/commit/d0258786))
  - bump electron-winstaller from 4.0.0 to 4.0.1 (#1825) ([89b66397](https://github.com/electron-userland/electron-forge/commit/89b66397))
  - upgrade transitive dependencies ([92d2adc1](https://github.com/electron-userland/electron-forge/commit/92d2adc1))
  - bump @octokit/rest from 16.43.1 to 18.0.0 (#1813) ([0a8d66ee](https://github.com/electron-userland/electron-forge/commit/0a8d66ee))
  - bump actions/setup-node from v1 to v2.1.0 ([27e1aea6](https://github.com/electron-userland/electron-forge/commit/27e1aea6))
  - bump actions/cache from v1 to v2 ([9c91acf5](https://github.com/electron-userland/electron-forge/commit/9c91acf5))
  - upgrade inquirer to 7.3.0 ([6bdb2a96](https://github.com/electron-userland/electron-forge/commit/6bdb2a96))
  - upgrade electron-installer-redhat to 3.1.0 ([ea35be30](https://github.com/electron-userland/electron-forge/commit/ea35be30))
  - upgrade electron-installer-debian to 3.1.0 ([c624b017](https://github.com/electron-userland/electron-forge/commit/c624b017))
- **deps-dev:**
  - upgrade lint-staged to 10.2.12 ([2434f042](https://github.com/electron-userland/electron-forge/commit/2434f042))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.10.1 ([96b79d54](https://github.com/electron-userland/electron-forge/commit/96b79d54))
  - upgrade typescript to ^4.0.2 ([89905835](https://github.com/electron-userland/electron-forge/commit/89905835))
  - upgrade ts-node to ^9.0.0 ([d6556bdf](https://github.com/electron-userland/electron-forge/commit/d6556bdf))
  - upgrade commitizen to 4.2.0 ([d0435b02](https://github.com/electron-userland/electron-forge/commit/d0435b02))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.10.0 ([482c8386](https://github.com/electron-userland/electron-forge/commit/482c8386))
  - upgrade @types/lodash to 4.14.160 ([37f04228](https://github.com/electron-userland/electron-forge/commit/37f04228))
  - upgrade commitizen to 4.1.5 ([0421b2ad](https://github.com/electron-userland/electron-forge/commit/0421b2ad))
  - upgrade @types/webpack-dev-middleware to 3.7.2 ([80ec76d5](https://github.com/electron-userland/electron-forge/commit/80ec76d5))
  - upgrade @types/mocha to 8.0.3 ([b59510ed](https://github.com/electron-userland/electron-forge/commit/b59510ed))
  - upgrade @types/inquirer to 7.3.1 ([2ee537a2](https://github.com/electron-userland/electron-forge/commit/2ee537a2))
  - upgrade @babel/core to 7.11.4 ([a50b3565](https://github.com/electron-userland/electron-forge/commit/a50b3565))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.9.1 ([34ff23c3](https://github.com/electron-userland/electron-forge/commit/34ff23c3))
  - bump @types/sinon from 9.0.4 to 9.0.5 ([56082c2b](https://github.com/electron-userland/electron-forge/commit/56082c2b))
  - bump typescript in /packages/template/typescript/tmpl ([cff9c915](https://github.com/electron-userland/electron-forge/commit/cff9c915))
  - bump typescript ([7d69849e](https://github.com/electron-userland/electron-forge/commit/7d69849e))
  - bump @types/semver from 7.3.2 to 7.3.3 ([f5590e7e](https://github.com/electron-userland/electron-forge/commit/f5590e7e))
  - bump fetch-mock from 9.10.6 to 9.10.7 (#1919) ([36715e0e](https://github.com/electron-userland/electron-forge/commit/36715e0e))
  - bump @types/node from 14.0.27 to 14.6.0 ([5f1decb8](https://github.com/electron-userland/electron-forge/commit/5f1decb8))
  - bump eslint from 7.6.0 to 7.7.0 (#1918) ([ac413c8e](https://github.com/electron-userland/electron-forge/commit/ac413c8e))
  - bump @types/semver from 7.3.1 to 7.3.2 ([3c28358e](https://github.com/electron-userland/electron-forge/commit/3c28358e))
  - bump style-loader ([8eab75a1](https://github.com/electron-userland/electron-forge/commit/8eab75a1))
  - bump node-loader ([401c5b6e](https://github.com/electron-userland/electron-forge/commit/401c5b6e))
  - bump node-loader in /packages/template/webpack/tmpl ([dcdc6581](https://github.com/electron-userland/electron-forge/commit/dcdc6581))
  - bump fork-ts-checker-webpack-plugin ([7c45045b](https://github.com/electron-userland/electron-forge/commit/7c45045b))
  - bump css-loader ([0fdb0c4a](https://github.com/electron-userland/electron-forge/commit/0fdb0c4a))
  - bump eslint to ^7 and @typescript-eslint to ^3 ([3d8bf0ea](https://github.com/electron-userland/electron-forge/commit/3d8bf0ea))
  - bump ts-loader ([7a574427](https://github.com/electron-userland/electron-forge/commit/7a574427))
  - bump style-loader in /packages/template/webpack/tmpl ([895bc947](https://github.com/electron-userland/electron-forge/commit/895bc947))
  - bump css-loader in /packages/template/webpack/tmpl ([c841c73b](https://github.com/electron-userland/electron-forge/commit/c841c73b))
  - bump sinon from 9.0.2 to 9.0.3 (#1901) ([3bc9c4a0](https://github.com/electron-userland/electron-forge/commit/3bc9c4a0))
  - bump @types/mocha from 8.0.1 to 8.0.2 ([789a8bec](https://github.com/electron-userland/electron-forge/commit/789a8bec))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.9.0 ([5602da63](https://github.com/electron-userland/electron-forge/commit/5602da63))
  - upgrade typedoc to ^0.18.0 ([ccb7dd74](https://github.com/electron-userland/electron-forge/commit/ccb7dd74))
  - upgrade eslint-plugin-mocha@^8.0.0 ([cd0c80ac](https://github.com/electron-userland/electron-forge/commit/cd0c80ac))
  - bump @types/lodash from 4.14.158 to 4.14.159 ([d8eadf3c](https://github.com/electron-userland/electron-forge/commit/d8eadf3c))
  - bump @babel/core from 7.11.0 to 7.11.1 (#1888) ([5e126423](https://github.com/electron-userland/electron-forge/commit/5e126423))
  - bump mocha from 8.1.0 to 8.1.1 (#1889) ([d5264904](https://github.com/electron-userland/electron-forge/commit/d5264904))
  - bump cz-customizable from 6.2.1 to 6.3.0 (#1885) ([02a0ed20](https://github.com/electron-userland/electron-forge/commit/02a0ed20))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.8.0 ([35109cf3](https://github.com/electron-userland/electron-forge/commit/35109cf3))
  - bump @types/mocha from 8.0.0 to 8.0.1 (#1877) ([fdd5799e](https://github.com/electron-userland/electron-forge/commit/fdd5799e))
  - bump fetch-mock from 9.10.5 to 9.10.6 (#1878) ([941d1630](https://github.com/electron-userland/electron-forge/commit/941d1630))
  - bump eslint from 7.5.0 to 7.6.0 (#1879) ([f7449307](https://github.com/electron-userland/electron-forge/commit/f7449307))
  - upgrade mocha to 8.1.0 ([83be715f](https://github.com/electron-userland/electron-forge/commit/83be715f))
  - ugprade @babel/{core,preset-env} to 7.11.0 ([10fee376](https://github.com/electron-userland/electron-forge/commit/10fee376))
  - upgrade @types/node to 14.0.27 ([f4a252ea](https://github.com/electron-userland/electron-forge/commit/f4a252ea))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.7.1 ([ba79a25b](https://github.com/electron-userland/electron-forge/commit/ba79a25b))
  - upgrade fetch-mock to 9.10.5 ([7a866af9](https://github.com/electron-userland/electron-forge/commit/7a866af9))
  - upgrade @types/node to 14.0.26 ([57739ba6](https://github.com/electron-userland/electron-forge/commit/57739ba6))
  - bump @types/node from 14.0.24 to 14.0.25 ([00b17d1d](https://github.com/electron-userland/electron-forge/commit/00b17d1d))
  - bump @types/chai from 4.2.11 to 4.2.12 ([dbbf2edf](https://github.com/electron-userland/electron-forge/commit/dbbf2edf))
  - upgrade @types/inquirer to ^7.3.0 ([a1dcb63f](https://github.com/electron-userland/electron-forge/commit/a1dcb63f))
  - upgrade @types/lodash to 4.14.158 ([95bbcd6c](https://github.com/electron-userland/electron-forge/commit/95bbcd6c))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.7.0 ([44bac784](https://github.com/electron-userland/electron-forge/commit/44bac784))
  - bump @types/node from 14.0.23 to 14.0.24 ([2a99544f](https://github.com/electron-userland/electron-forge/commit/2a99544f))
  - bump fetch-mock from 9.10.3 to 9.10.4 (#1847) ([1da33f3a](https://github.com/electron-userland/electron-forge/commit/1da33f3a))
  - bump eslint from 7.4.0 to 7.5.0 (#1848) ([b3bdfd53](https://github.com/electron-userland/electron-forge/commit/b3bdfd53))
  - bump typescript from 3.9.6 to 3.9.7 ([a8bbc448](https://github.com/electron-userland/electron-forge/commit/a8bbc448))
  - upgrade @babel/{cli,core,register} to 7.10.5 ([4d0e216f](https://github.com/electron-userland/electron-forge/commit/4d0e216f))
  - upgrade @types/node to 14.0.23 ([2a2cf774](https://github.com/electron-userland/electron-forge/commit/2a2cf774))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.6.1 ([05ad967c](https://github.com/electron-userland/electron-forge/commit/05ad967c))
  - bump @types/mocha from 7.0.2 to 8.0.0 ([e945d3f0](https://github.com/electron-userland/electron-forge/commit/e945d3f0))
  - bump @types/node from 14.0.19 to 14.0.20 ([09279a34](https://github.com/electron-userland/electron-forge/commit/09279a34))
  - bump @types/node from 14.0.18 to 14.0.19 ([c916bc40](https://github.com/electron-userland/electron-forge/commit/c916bc40))
  - bump @types/webpack from 4.41.20 to 4.41.21 (#1824) ([d189b207](https://github.com/electron-userland/electron-forge/commit/d189b207))
  - upgrade cz-customizable to 6.2.1 ([78bea45d](https://github.com/electron-userland/electron-forge/commit/78bea45d))
  - upgrade @types/node to 14.0.18 ([df72966b](https://github.com/electron-userland/electron-forge/commit/df72966b))
  - upgrade @types/glob to ^7.1.3 ([35d8346a](https://github.com/electron-userland/electron-forge/commit/35d8346a))
  - upgrade @types/chai-as-promised to 7.1.3 ([249adf65](https://github.com/electron-userland/electron-forge/commit/249adf65))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.6.0 ([beb6f024](https://github.com/electron-userland/electron-forge/commit/beb6f024))
  - bump @types/express from 4.17.6 to 4.17.7 (#1821) ([6b771c82](https://github.com/electron-userland/electron-forge/commit/6b771c82))
  - bump @types/webpack from 4.41.18 to 4.41.20 (#1819) ([54eecde3](https://github.com/electron-userland/electron-forge/commit/54eecde3))
  - bump eslint from 7.3.1 to 7.4.0 (#1812) ([d87635f2](https://github.com/electron-userland/electron-forge/commit/d87635f2))
  - upgrade typescript to 3.9.6 ([602bc11c](https://github.com/electron-userland/electron-forge/commit/602bc11c))
  - upgrade @babel/\* to 7.10.4 ([885950aa](https://github.com/electron-userland/electron-forge/commit/885950aa))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 3.5.0 ([3674b174](https://github.com/electron-userland/electron-forge/commit/3674b174))
  - upgrade typedoc to 0.17.8 ([93a696c3](https://github.com/electron-userland/electron-forge/commit/93a696c3))
- **ci:**
  - codecov/codecov-action@v1 isn't actually updated to latest v1.x.y ([ba00d28e](https://github.com/electron-userland/electron-forge/commit/ba00d28e))
  - use Codecov Action instead of devDependency (#1854) ([623539c8](https://github.com/electron-userland/electron-forge/commit/623539c8))

##### New Features

- add Electronegativity plugin (#1900) ([a6a65cae](https://github.com/electron-userland/electron-forge/commit/a6a65cae))
- **core:** add params to the postPackage hook (#1896) ([e9a2ba07](https://github.com/electron-userland/electron-forge/commit/e9a2ba07))

##### Bug Fixes

- **template:** remove TS warning while scaffolding TS templates (#1664) ([e447adc6](https://github.com/electron-userland/electron-forge/commit/e447adc6))
- **plugin-webpack:** prevent the renderer config from overriding its preload config's target (#1853) ([8126a736](https://github.com/electron-userland/electron-forge/commit/8126a736))
- **core:** Re-throw non-require errors when using requireSearch (#1876) ([301d6e17](https://github.com/electron-userland/electron-forge/commit/301d6e17))

##### Refactors

- **template:** move devDependencies to fake package.json for Dependabot (#1904) ([559a9f87](https://github.com/electron-userland/electron-forge/commit/559a9f87))

#### [6.0.0-beta.52](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.52) (2020-06-27)

##### Build System / Dependencies

- **deps-dev:**
  - remove obsolete @types/electron-packager ([dc4f8bf6](https://github.com/electron-userland/electron-forge/commit/dc4f8bf6))
  - upgrade mocha transitive dependencies ([33f2af80](https://github.com/electron-userland/electron-forge/commit/33f2af80))
  - upgrade eslint-plugin-import to 2.22.0 ([70fe2802](https://github.com/electron-userland/electron-forge/commit/70fe2802))
  - bump @types/webpack from 4.41.17 to 4.41.18 (#1797) ([139dfd4e](https://github.com/electron-userland/electron-forge/commit/139dfd4e))
  - bump @types/semver from 7.2.0 to 7.3.1 ([c7e506c8](https://github.com/electron-userland/electron-forge/commit/c7e506c8))
  - bump fetch-mock from 9.10.2 to 9.10.3 (#1794) ([b0d72043](https://github.com/electron-userland/electron-forge/commit/b0d72043))
  - bump @types/node from 14.0.13 to 14.0.14 ([6bb2622f](https://github.com/electron-userland/electron-forge/commit/6bb2622f))
  - bump @types/lodash from 4.14.156 to 4.14.157 ([885acb15](https://github.com/electron-userland/electron-forge/commit/885acb15))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.4.0 ([4e7e08d5](https://github.com/electron-userland/electron-forge/commit/4e7e08d5))
  - upgrade eslint to 7.3.1 ([a32766ec](https://github.com/electron-userland/electron-forge/commit/a32766ec))
  - bump @babel/register from 7.10.1 to 7.10.3 (#1778) ([e8688563](https://github.com/electron-userland/electron-forge/commit/e8688563))
  - bump @babel/preset-env from 7.10.2 to 7.10.3 (#1782) ([79a18e2a](https://github.com/electron-userland/electron-forge/commit/79a18e2a))
  - bump @babel/cli from 7.10.1 to 7.10.3 ([13129f0f](https://github.com/electron-userland/electron-forge/commit/13129f0f))
  - bump @babel/core from 7.10.2 to 7.10.3 (#1779) ([774a6da2](https://github.com/electron-userland/electron-forge/commit/774a6da2))
  - bump @types/lodash from 4.14.155 to 4.14.156 ([1824698f](https://github.com/electron-userland/electron-forge/commit/1824698f))
  - bump fetch-mock from 9.10.1 to 9.10.2 (#1783) ([1489ab5b](https://github.com/electron-userland/electron-forge/commit/1489ab5b))
  - bump lint-staged from 10.2.10 to 10.2.11 (#1773) ([deff81a6](https://github.com/electron-userland/electron-forge/commit/deff81a6))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.3.0 ([f763b1c4](https://github.com/electron-userland/electron-forge/commit/f763b1c4))
  - bump eslint-config-airbnb-base from 14.1.0 to 14.2.0 (#1765) ([fd692b96](https://github.com/electron-userland/electron-forge/commit/fd692b96))
  - bump lint-staged from 10.2.9 to 10.2.10 (#1768) ([e29fea68](https://github.com/electron-userland/electron-forge/commit/e29fea68))
  - bump mocha from 7.2.0 to 8.0.1 (#1757) ([a3c3cb7b](https://github.com/electron-userland/electron-forge/commit/a3c3cb7b))
  - bump eslint-plugin-import from 2.21.1 to 2.21.2 ([1fe89939](https://github.com/electron-userland/electron-forge/commit/1fe89939))
  - bump @types/node from 14.0.12 to 14.0.13 ([cdea61c7](https://github.com/electron-userland/electron-forge/commit/cdea61c7))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.2.0 ([c5e4d2ac](https://github.com/electron-userland/electron-forge/commit/c5e4d2ac))
  - bump @types/node from 14.0.11 to 14.0.12 ([ea88a193](https://github.com/electron-userland/electron-forge/commit/ea88a193))
  - bump babel-plugin-source-map-support ([4176ce24](https://github.com/electron-userland/electron-forge/commit/4176ce24))
  - bump eslint-plugin-import from 2.20.2 to 2.21.1 (#1746) ([56de51a1](https://github.com/electron-userland/electron-forge/commit/56de51a1))
  - upgrade eslint to 7.2.0 ([69b1893b](https://github.com/electron-userland/electron-forge/commit/69b1893b))
  - bump @types/glob from 7.1.1 to 7.1.2 ([29f577eb](https://github.com/electron-userland/electron-forge/commit/29f577eb))
  - bump typescript from 3.9.3 to 3.9.5 ([0cc15e8f](https://github.com/electron-userland/electron-forge/commit/0cc15e8f))
  - bump @types/node from 14.0.10 to 14.0.11 ([09dee37d](https://github.com/electron-userland/electron-forge/commit/09dee37d))
  - bump lint-staged from 10.2.8 to 10.2.9 ([9b3ba871](https://github.com/electron-userland/electron-forge/commit/9b3ba871))
  - bump @types/lodash from 4.14.154 to 4.14.155 ([2f22e8ae](https://github.com/electron-userland/electron-forge/commit/2f22e8ae))
  - bump @types/node from 14.0.9 to 14.0.10 ([aed0f74d](https://github.com/electron-userland/electron-forge/commit/aed0f74d))
  - bump lint-staged from 10.2.7 to 10.2.8 (#1737) ([da8ba8f9](https://github.com/electron-userland/electron-forge/commit/da8ba8f9))
  - upgrade @types/webpack to 4.41.17 ([4164fc7f](https://github.com/electron-userland/electron-forge/commit/4164fc7f))
  - bump @types/node from 14.0.6 to 14.0.9 ([e6fcf04e](https://github.com/electron-userland/electron-forge/commit/e6fcf04e))
  - upgrade @babel/{core,preset-env} to 7.10.2 ([dd187997](https://github.com/electron-userland/electron-forge/commit/dd187997))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.1.0 ([445a7d55](https://github.com/electron-userland/electron-forge/commit/445a7d55))
  - bump @types/webpack from 4.41.14 to 4.41.16 ([d818ab3d](https://github.com/electron-userland/electron-forge/commit/d818ab3d))
  - bump eslint-plugin-mocha from 7.0.0 to 7.0.1 ([9328a394](https://github.com/electron-userland/electron-forge/commit/9328a394))
  - bump @types/lodash from 4.14.153 to 4.14.154 ([fb47fe59](https://github.com/electron-userland/electron-forge/commit/fb47fe59))
  - bump nyc from 15.0.1 to 15.1.0 (#1730) ([b87f9e8f](https://github.com/electron-userland/electron-forge/commit/b87f9e8f))
  - upgrade @types/webpack to 4.41.14 ([3a4bcc83](https://github.com/electron-userland/electron-forge/commit/3a4bcc83))
  - upgrade @types/node to 14.0.6 ([c26af2a1](https://github.com/electron-userland/electron-forge/commit/c26af2a1))
  - bump lint-staged from 10.2.6 to 10.2.7 (#1723) ([f77a0875](https://github.com/electron-userland/electron-forge/commit/f77a0875))
  - bump ts-node from 8.10.1 to 8.10.2 ([b4d9d286](https://github.com/electron-userland/electron-forge/commit/b4d9d286))
  - upgrade @babel/\* to 7.10.1 ([ada8453b](https://github.com/electron-userland/electron-forge/commit/ada8453b))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.0.2 ([9abbd6f5](https://github.com/electron-userland/electron-forge/commit/9abbd6f5))
  - upgrade @babel/{cli,core,preset-env} to 7.10.0 ([e53c0162](https://github.com/electron-userland/electron-forge/commit/e53c0162))
  - bump @types/lodash from 4.14.152 to 4.14.153 ([9b3e110e](https://github.com/electron-userland/electron-forge/commit/9b3e110e))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 3.0.1 ([3c14609f](https://github.com/electron-userland/electron-forge/commit/3c14609f))
  - bump fetch-mock from 9.10.0 to 9.10.1 (#1704) ([0152dbf0](https://github.com/electron-userland/electron-forge/commit/0152dbf0))
  - upgrade mocha to 7.2.0 ([49a9ba6b](https://github.com/electron-userland/electron-forge/commit/49a9ba6b))
  - upgrade eslint to 7.1.0 ([bf6fb421](https://github.com/electron-userland/electron-forge/commit/bf6fb421))
  - upgrade typescript to 3.9.3 ([6f85bd4f](https://github.com/electron-userland/electron-forge/commit/6f85bd4f))
  - upgrade eslint & eslint-plugin-mocha to ^7.0.0 ([738720d6](https://github.com/electron-userland/electron-forge/commit/738720d6))
  - upgrade @types/semver to 7.2.0 ([c682a419](https://github.com/electron-userland/electron-forge/commit/c682a419))
  - upgrade @types/sinon to 9.0.4 ([2a2440a4](https://github.com/electron-userland/electron-forge/commit/2a2440a4))
  - upgrade @types/lodash to 4.14.152 ([4331ccb1](https://github.com/electron-userland/electron-forge/commit/4331ccb1))
  - upgrade @types/fs-extra to ^9.0.1 ([b8c74ae5](https://github.com/electron-userland/electron-forge/commit/b8c74ae5))
  - upgrade @types/cross-spawn to 6.0.2 ([5ed084f1](https://github.com/electron-userland/electron-forge/commit/5ed084f1))
  - upgrade @types/node to ^14.0.5 ([61effdc3](https://github.com/electron-userland/electron-forge/commit/61effdc3))
  - upgrade @types/webpack\* ([7896392f](https://github.com/electron-userland/electron-forge/commit/7896392f))
  - upgrade fetch-mock to 9.10.0 ([d6647095](https://github.com/electron-userland/electron-forge/commit/d6647095))
  - upgrade nodemon to 2.0.4 ([6dc77a83](https://github.com/electron-userland/electron-forge/commit/6dc77a83))
  - upgrade lint-staged to 10.2.6 ([bc7066fd](https://github.com/electron-userland/electron-forge/commit/bc7066fd))
  - upgrade typedoc to 0.17.7 ([1d5f4338](https://github.com/electron-userland/electron-forge/commit/1d5f4338))
  - upgrade codecov to 3.7.0 ([3ed74b37](https://github.com/electron-userland/electron-forge/commit/3ed74b37))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to ^3.0.0 ([50b32fb5](https://github.com/electron-userland/electron-forge/commit/50b32fb5))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.32.0 ([1cfe0498](https://github.com/electron-userland/electron-forge/commit/1cfe0498))
  - upgrade fetch-mock to 9.7.0 ([5053757c](https://github.com/electron-userland/electron-forge/commit/5053757c))
  - upgrade @types/node to 13.13.5 ([77e3a9ea](https://github.com/electron-userland/electron-forge/commit/77e3a9ea))
  - upgrade fetch-mock to 9.5.0 ([c4c6dfbd](https://github.com/electron-userland/electron-forge/commit/c4c6dfbd))
  - upgrade commitizen to 4.1.2 ([23a4376a](https://github.com/electron-userland/electron-forge/commit/23a4376a))
  - upgrade @types/html-minifier-terser to 5.1.0 ([0dbbd266](https://github.com/electron-userland/electron-forge/commit/0dbbd266))
  - upgrade lint-staged to 10.2.2 ([20eaa06f](https://github.com/electron-userland/electron-forge/commit/20eaa06f))
  - upgrade ts-node to 8.10.1 ([02443605](https://github.com/electron-userland/electron-forge/commit/02443605))
  - upgrade commitizen to 4.1.0 ([7a235ba4](https://github.com/electron-userland/electron-forge/commit/7a235ba4))
  - upgrade @babel/{core,preset-env} to 7.9.6 ([82281eed](https://github.com/electron-userland/electron-forge/commit/82281eed))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.31.0 ([c26da14a](https://github.com/electron-userland/electron-forge/commit/c26da14a))
- **deps:**
  - upgrade electron-packager to ^15.0.0 ([3046754b](https://github.com/electron-userland/electron-forge/commit/3046754b))
  - bump inquirer from 7.1.0 to 7.2.0 (#1769) ([3fc875f5](https://github.com/electron-userland/electron-forge/commit/3fc875f5))
  - bump electron-osx-sign from 0.4.16 to 0.4.17 (#1764) ([ccbb865a](https://github.com/electron-userland/electron-forge/commit/ccbb865a))
  - bump xterm from 4.6.0 to 4.7.0 (#1763) ([50abcd40](https://github.com/electron-userland/electron-forge/commit/50abcd40))
  - upgrade @malept/electron-installer-flatpak to ^0.11.2 ([d56e3e8e](https://github.com/electron-userland/electron-forge/commit/d56e3e8e))
  - bump fs-extra from 9.0.0 to 9.0.1 (#1739) ([ffc2332c](https://github.com/electron-userland/electron-forge/commit/ffc2332c))
  - upgrade transitive dependencies for electron tooling modules ([39510226](https://github.com/electron-userland/electron-forge/commit/39510226))
  - upgrade webpack-related transitive dependencies ([5f5130ea](https://github.com/electron-userland/electron-forge/commit/5f5130ea))
  - bump cross-spawn from 7.0.2 to 7.0.3 (#1707) ([7fe1002e](https://github.com/electron-userland/electron-forge/commit/7fe1002e))
  - upgrade xterm-addon-search to ^0.7.0 ([4cdfed67](https://github.com/electron-userland/electron-forge/commit/4cdfed67))
  - upgrade xterm-addon-fit to ^0.4.0 ([5aebc9b9](https://github.com/electron-userland/electron-forge/commit/5aebc9b9))
  - upgrade xterm to 4.6.0 ([b526c521](https://github.com/electron-userland/electron-forge/commit/b526c521))
  - upgrade open to 7.0.4 ([3f17826e](https://github.com/electron-userland/electron-forge/commit/3f17826e))
  - upgrade electron-osx-sign to 0.4.16 ([27c15e31](https://github.com/electron-userland/electron-forge/commit/27c15e31))
  - upgrade electron-rebuild to 1.11.0 ([e2f23f34](https://github.com/electron-userland/electron-forge/commit/e2f23f34))
  - upgrade cross-zip to 3.1.0 ([5ff74664](https://github.com/electron-userland/electron-forge/commit/5ff74664))
  - upgrade @electron/get to 1.12.2 ([68201f24](https://github.com/electron-userland/electron-forge/commit/68201f24))
  - upgrade transitive dependencies ([8b4e0cf8](https://github.com/electron-userland/electron-forge/commit/8b4e0cf8))
  - upgrade pretty-ms to ^7.0.0 ([62e55a0a](https://github.com/electron-userland/electron-forge/commit/62e55a0a))
  - upgrade html-webpack-plugin to 4.3.0 ([612656d6](https://github.com/electron-userland/electron-forge/commit/612656d6))
  - upgrade sudo-prompt to 9.2.1 ([d32d2b1f](https://github.com/electron-userland/electron-forge/commit/d32d2b1f))
- remove some CI workarounds ([d7d3d384](https://github.com/electron-userland/electron-forge/commit/d7d3d384))
- remove an unused but broken apt repo from CI ([33d0362a](https://github.com/electron-userland/electron-forge/commit/33d0362a))
- **ci:** remove yet another malfunctioning, unrelated apt repo from CI ([471b0517](https://github.com/electron-userland/electron-forge/commit/471b0517))

##### Chores

- **core:** silence lint warning ([116c11fd](https://github.com/electron-userland/electron-forge/commit/116c11fd))
- add funding information ([2d364e22](https://github.com/electron-userland/electron-forge/commit/2d364e22))

##### Documentation Changes

- **template:** fix explanation of darwin auto-quit prevention (#1756) ([50ffbc9a](https://github.com/electron-userland/electron-forge/commit/50ffbc9a))

##### Bug Fixes

- **shared-types:** don't use @types/electron-packager ([cdeddce2](https://github.com/electron-userland/electron-forge/commit/cdeddce2))
- **maker-snap:** allow MakerSnapConfig to also be SnapcraftConfig (#1725) ([19b64ef5](https://github.com/electron-userland/electron-forge/commit/19b64ef5))
- **maker-flatpak:** add eu-strip to required external binaries (#1703) ([4314e1d5](https://github.com/electron-userland/electron-forge/commit/4314e1d5))

##### Refactors

- **core:** use electron-installer-common to read package.json from packaged app (#1798) ([5279272d](https://github.com/electron-userland/electron-forge/commit/5279272d))
- sudo-prompt provides its own typings (#1799) ([3cc007fd](https://github.com/electron-userland/electron-forge/commit/3cc007fd))
- **maker-squirrel:** inherit the config & docs from electron-winstaller (#1791) ([69c27228](https://github.com/electron-userland/electron-forge/commit/69c27228))

#### [6.0.0-beta.51](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.51) (2020-04-27)

##### Build System / Dependencies

- **deps-dev:**
  - bump typedoc from 0.17.4 to 0.17.6 (#1648) ([3be58d00](https://github.com/electron-userland/electron-forge/commit/3be58d00))
  - bump @types/node from 13.13.2 to 13.13.4 ([ec4e3b68](https://github.com/electron-userland/electron-forge/commit/ec4e3b68))
  - bump mocha from 7.1.1 to 7.1.2 (#1650) ([5ce9d765](https://github.com/electron-userland/electron-forge/commit/5ce9d765))
  - bump ts-node from 8.9.0 to 8.9.1 ([d85e33c5](https://github.com/electron-userland/electron-forge/commit/d85e33c5))
  - upgrade @types/express to 4.17.6 ([e1e8413f](https://github.com/electron-userland/electron-forge/commit/e1e8413f))
  - upgrade @types/webpack-hot-middleware to 2.25.2 ([0f519dd9](https://github.com/electron-userland/electron-forge/commit/0f519dd9))
  - upgrade @types/webpack to 4.41.12 ([812736b0](https://github.com/electron-userland/electron-forge/commit/812736b0))
  - upgrade ts-node to 8.9.0 ([969ce317](https://github.com/electron-userland/electron-forge/commit/969ce317))
  - upgrade @types/lodash to 4.14.150 ([94a1dd01](https://github.com/electron-userland/electron-forge/commit/94a1dd01))
  - upgrade lint-staged to 10.1.7 ([5e1043e1](https://github.com/electron-userland/electron-forge/commit/5e1043e1))
  - upgrade fetch-mock to 9.4.0 ([694102bc](https://github.com/electron-userland/electron-forge/commit/694102bc))
  - upgrade @types/node to 13.13.2 ([ba3521fd](https://github.com/electron-userland/electron-forge/commit/ba3521fd))
  - upgrade @types/node-fetch to 2.5.7 ([b6a1cf85](https://github.com/electron-userland/electron-forge/commit/b6a1cf85))
  - upgrade @typescript-eslint/{eslint-plugin,parser} to 2.29.0 ([968aae60](https://github.com/electron-userland/electron-forge/commit/968aae60))
  - bump lint-staged from 10.1.2 to 10.1.3 ([e134a612](https://github.com/electron-userland/electron-forge/commit/e134a612))
  - bump husky from 4.2.3 to 4.2.5 (#1622) ([c3308e9d](https://github.com/electron-userland/electron-forge/commit/c3308e9d))
  - bump nodemon from 2.0.2 to 2.0.3 ([b9000c59](https://github.com/electron-userland/electron-forge/commit/b9000c59))
  - bump sinon from 9.0.1 to 9.0.2 (#1617) ([cc9c2f58](https://github.com/electron-userland/electron-forge/commit/cc9c2f58))
  - bump @types/node from 13.11.0 to 13.11.1 ([66069bab](https://github.com/electron-userland/electron-forge/commit/66069bab))
  - bump @babel/preset-env from 7.9.0 to 7.9.5 (#1613) ([9059e69e](https://github.com/electron-userland/electron-forge/commit/9059e69e))
  - bump commitizen from 4.0.3 to 4.0.4 (#1614) ([0de385c5](https://github.com/electron-userland/electron-forge/commit/0de385c5))
  - bump typedoc from 0.17.3 to 0.17.4 ([2ae60f84](https://github.com/electron-userland/electron-forge/commit/2ae60f84))
  - upgrade ts-node to 8.8.2 ([7f6afc0e](https://github.com/electron-userland/electron-forge/commit/7f6afc0e))
  - upgrade lint-staged to 10.1.2 ([c2abd0bc](https://github.com/electron-userland/electron-forge/commit/c2abd0bc))
  - upgrade nyc to 15.0.1 ([0792db7f](https://github.com/electron-userland/electron-forge/commit/0792db7f))
  - bump @types/node from 13.9.8 to 13.11.0 ([f073e92a](https://github.com/electron-userland/electron-forge/commit/f073e92a))
  - upgrade @types/sinon to ^9.0.0 ([23d02c5e](https://github.com/electron-userland/electron-forge/commit/23d02c5e))
  - ugprade @types/express to 4.17.4 ([20149686](https://github.com/electron-userland/electron-forge/commit/20149686))
  - upgrade html-webpack-plugin to 4.0.4 ([d4686138](https://github.com/electron-userland/electron-forge/commit/d4686138))
  - upgrade lint-staged to 10.1.1 ([3a46a3b5](https://github.com/electron-userland/electron-forge/commit/3a46a3b5))
  - upgrade transitive dependencies ([466113a5](https://github.com/electron-userland/electron-forge/commit/466113a5))
  - upgrade @types/node to 13.9.8 ([18072957](https://github.com/electron-userland/electron-forge/commit/18072957))
  - upgrade asar to 3.0.3 ([917ac487](https://github.com/electron-userland/electron-forge/commit/917ac487))
  - upgrade @types/webpack to 4.41.10 ([ce8f49cc](https://github.com/electron-userland/electron-forge/commit/ce8f49cc))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.26.0 ([98b4f8c2](https://github.com/electron-userland/electron-forge/commit/98b4f8c2))
  - upgrade @types/webpack to 4.41.9 ([c71bc263](https://github.com/electron-userland/electron-forge/commit/c71bc263))
  - upgrade @types/node to 13.9.6 ([9f3853d3](https://github.com/electron-userland/electron-forge/commit/9f3853d3))
  - upgrade eslint-plugin-import to 2.20.2 ([fc1a764d](https://github.com/electron-userland/electron-forge/commit/fc1a764d))
  - upgrade lint-staged to 10.1.0 ([a017a84e](https://github.com/electron-userland/electron-forge/commit/a017a84e))
  - upgrade @types/node to 13.9.5 ([d65a8f12](https://github.com/electron-userland/electron-forge/commit/d65a8f12))
  - bump @types/node from 13.9.3 to 13.9.4 ([3b753b6e](https://github.com/electron-userland/electron-forge/commit/3b753b6e))
  - relax commitizen's minimist dependency to ^1.2.5 ([ca17ddcc](https://github.com/electron-userland/electron-forge/commit/ca17ddcc))
  - upgrade lint-staged to 10.0.9 ([2c3594fe](https://github.com/electron-userland/electron-forge/commit/2c3594fe))
  - upgrade fetch-mock to 9.3.1 ([573f5f76](https://github.com/electron-userland/electron-forge/commit/573f5f76))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.25.0 ([1aadc7b9](https://github.com/electron-userland/electron-forge/commit/1aadc7b9))
  - upgrade asar to 3.0.2 ([432fe6f8](https://github.com/electron-userland/electron-forge/commit/432fe6f8))
  - upgrade @babel/\* to 7.9.0 ([b22900f3](https://github.com/electron-userland/electron-forge/commit/b22900f3))
  - bump ts-node from 8.7.0 to 8.8.1 ([78c5aeb3](https://github.com/electron-userland/electron-forge/commit/78c5aeb3))
  - bump @types/webpack from 4.41.7 to 4.41.8 (#1583) ([98ba2879](https://github.com/electron-userland/electron-forge/commit/98ba2879))
  - bump @types/node from 13.9.2 to 13.9.3 ([2cbef700](https://github.com/electron-userland/electron-forge/commit/2cbef700))
  - bump typedoc from 0.17.1 to 0.17.3 ([9b97b704](https://github.com/electron-userland/electron-forge/commit/9b97b704))
  - upgrade @types/node to 13.9.2 ([f4bb5435](https://github.com/electron-userland/electron-forge/commit/f4bb5435))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.24.0 ([75e92f9b](https://github.com/electron-userland/electron-forge/commit/75e92f9b))
  - bump fetch-mock from 9.1.2 to 9.2.1 (#1568) ([77dcecd0](https://github.com/electron-userland/electron-forge/commit/77dcecd0))
  - bump typedoc from 0.16.11 to 0.17.1 (#1573) ([794d0738](https://github.com/electron-userland/electron-forge/commit/794d0738))
  - bump ts-node from 8.6.2 to 8.7.0 (#1575) ([c97b6566](https://github.com/electron-userland/electron-forge/commit/c97b6566))
  - bump eslint-config-airbnb-base from 14.0.0 to 14.1.0 ([3059b3fe](https://github.com/electron-userland/electron-forge/commit/3059b3fe))
  - bump @types/chai from 4.2.10 to 4.2.11 ([a7a2246e](https://github.com/electron-userland/electron-forge/commit/a7a2246e))
  - bump mocha from 7.1.0 to 7.1.1 (#1574) ([40a601a9](https://github.com/electron-userland/electron-forge/commit/40a601a9))
  - upgrade eslint dependencies ([180cac4d](https://github.com/electron-userland/electron-forge/commit/180cac4d))
  - bump fetch-mock from 9.1.1 to 9.1.2 (#1564) ([1c0e5d8a](https://github.com/electron-userland/electron-forge/commit/1c0e5d8a))
  - bump minimist from 1.2.4 to 1.2.5 ([fe2cdd51](https://github.com/electron-userland/electron-forge/commit/fe2cdd51))
  - bump @types/node from 13.9.0 to 13.9.1 ([236c3afb](https://github.com/electron-userland/electron-forge/commit/236c3afb))
  - bump asar from 3.0.0 to 3.0.1 (#1561) ([0f212202](https://github.com/electron-userland/electron-forge/commit/0f212202))
  - bump minimist from 1.2.3 to 1.2.4 ([b579c167](https://github.com/electron-userland/electron-forge/commit/b579c167))
  - upgrade asar to ^3.0.0 ([56c61cfd](https://github.com/electron-userland/electron-forge/commit/56c61cfd))
  - upgrade minimist to 1.2.3 ([821be096](https://github.com/electron-userland/electron-forge/commit/821be096))
  - upgrade sinon to 9.0.1 ([650ee07b](https://github.com/electron-userland/electron-forge/commit/650ee07b))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.23.0 ([e1661474](https://github.com/electron-userland/electron-forge/commit/e1661474))
  - upgrade @types/node to 13.9.0 ([da229e81](https://github.com/electron-userland/electron-forge/commit/da229e81))
  - bump fetch-mock from 9.1.0 to 9.1.1 (#1555) ([c8ff9128](https://github.com/electron-userland/electron-forge/commit/c8ff9128))
  - bump cross-env from 7.0.1 to 7.0.2 ([0f08a02d](https://github.com/electron-userland/electron-forge/commit/0f08a02d))
  - bump @babel/preset-env from 7.8.6 to 7.8.7 (#1552) ([6e5c7dfb](https://github.com/electron-userland/electron-forge/commit/6e5c7dfb))
  - bump @babel/core from 7.8.6 to 7.8.7 ([6dd4f3ed](https://github.com/electron-userland/electron-forge/commit/6dd4f3ed))
  - bump fetch-mock from 9.0.0 to 9.1.0 (#1548) ([8874746e](https://github.com/electron-userland/electron-forge/commit/8874746e))
  - bump cross-env from 7.0.0 to 7.0.1 ([d7b80c7e](https://github.com/electron-userland/electron-forge/commit/d7b80c7e))
  - bump @types/mocha from 7.0.1 to 7.0.2 ([6c0b114f](https://github.com/electron-userland/electron-forge/commit/6c0b114f))
  - bump @types/express from 4.17.2 to 4.17.3 (#1545) ([0dca3f8e](https://github.com/electron-userland/electron-forge/commit/0dca3f8e))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.22.0 ([28dbb194](https://github.com/electron-userland/electron-forge/commit/28dbb194))
  - bump @types/chai from 4.2.9 to 4.2.10 ([1c8668db](https://github.com/electron-userland/electron-forge/commit/1c8668db))
  - bump typescript from 3.8.2 to 3.8.3 ([d1f09a5b](https://github.com/electron-userland/electron-forge/commit/d1f09a5b))
  - bump @types/node from 13.7.6 to 13.7.7 ([fb725329](https://github.com/electron-userland/electron-forge/commit/fb725329))
  - bump fetch-mock from 8.3.2 to 9.0.0 (#1534) ([d4b7e9ce](https://github.com/electron-userland/electron-forge/commit/d4b7e9ce))
  - bump typedoc from 0.16.10 to 0.16.11 (#1526) ([0fd31fb0](https://github.com/electron-userland/electron-forge/commit/0fd31fb0))
  - bump mocha from 7.0.1 to 7.1.0 (#1519) ([cd4785bb](https://github.com/electron-userland/electron-forge/commit/cd4785bb))
  - bump @types/webpack-dev-middleware from 2.0.3 to 3.7.0 (#1517) ([fa8dfc8e](https://github.com/electron-userland/electron-forge/commit/fa8dfc8e))
  - bump @types/node from 13.7.5 to 13.7.6 ([59777cf8](https://github.com/electron-userland/electron-forge/commit/59777cf8))
- **deps:**
  - bump log-symbols from 3.0.0 to 4.0.0 (#1649) ([6c8e4439](https://github.com/electron-userland/electron-forge/commit/6c8e4439))
  - upgrade electron-installer-snap to ^5.1.0 (#1644) ([0e22ba18](https://github.com/electron-userland/electron-forge/commit/0e22ba18))
  - upgrade xterm-addon-search to ^0.6.0 ([f4ff3317](https://github.com/electron-userland/electron-forge/commit/f4ff3317))
  - upgrade html-webpack-plugin to 4.2.0 ([f092af56](https://github.com/electron-userland/electron-forge/commit/f092af56))
  - upgrade webpack to 4.43.0 ([e75754f7](https://github.com/electron-userland/electron-forge/commit/e75754f7))
  - upgrade source-map-support to 0.5.19 ([197eac7d](https://github.com/electron-userland/electron-forge/commit/197eac7d))
  - upgrade semver to 7.3.2 ([b053d3b7](https://github.com/electron-userland/electron-forge/commit/b053d3b7))
  - upgrade ora to 4.0.4 ([ee410671](https://github.com/electron-userland/electron-forge/commit/ee410671))
  - upgrade mime-types to 2.1.27 ([dc84cbdb](https://github.com/electron-userland/electron-forge/commit/dc84cbdb))
  - upgrade @electron/get to 1.10.0 ([2b3cfbec](https://github.com/electron-userland/electron-forge/commit/2b3cfbec))
  - bump xterm from 4.4.0 to 4.5.0 (#1624) ([c8e301a2](https://github.com/electron-userland/electron-forge/commit/c8e301a2))
  - bump semver from 7.1.3 to 7.2.1 (#1611) ([00f0b29b](https://github.com/electron-userland/electron-forge/commit/00f0b29b))
  - upgrade cross-spawn to 7.0.2 ([e04f1a43](https://github.com/electron-userland/electron-forge/commit/e04f1a43))
  - upgrade html-webpack-plugin to 4.0.3 ([3cbd0f11](https://github.com/electron-userland/electron-forge/commit/3cbd0f11))
  - bump @malept/cross-spawn-promise from 1.0.0 to 1.1.0 (#1593) ([edd6071a](https://github.com/electron-userland/electron-forge/commit/edd6071a))
  - bump html-webpack-plugin from 4.0.1 to 4.0.2 (#1588) ([50d57b3d](https://github.com/electron-userland/electron-forge/commit/50d57b3d))
  - upgrade webpack to 4.42.1 ([aec996d6](https://github.com/electron-userland/electron-forge/commit/aec996d6))
  - upgrade html-webpack-plugin to ^4.0.1 ([9a975ebd](https://github.com/electron-userland/electron-forge/commit/9a975ebd))
  - bump fs-extra from 8.1.0 to 9.0.0 (#1577) ([16b1e870](https://github.com/electron-userland/electron-forge/commit/16b1e870))
  - [security] bump acorn from 6.4.0 to 6.4.1 ([37a0904d](https://github.com/electron-userland/electron-forge/commit/37a0904d))
  - upgrade inquirer to 7.1.0 ([2786fdbe](https://github.com/electron-userland/electron-forge/commit/2786fdbe))
  - upgrade electron-rebuild to 1.10.1 ([d63fcdc3](https://github.com/electron-userland/electron-forge/commit/d63fcdc3))
  - bump open from 7.0.2 to 7.0.3 (#1558) ([683fbf32](https://github.com/electron-userland/electron-forge/commit/683fbf32))
  - upgrade dependencies for electron-rebuild ([56be8ee1](https://github.com/electron-userland/electron-forge/commit/56be8ee1))
  - bump @electron/get from 1.8.0 to 1.9.0 (#1554) ([dc6a5970](https://github.com/electron-userland/electron-forge/commit/dc6a5970))
  - bump inquirer from 7.0.5 to 7.0.6 (#1551) ([a75d0e0d](https://github.com/electron-userland/electron-forge/commit/a75d0e0d))
  - bump pretty-ms from 6.0.0 to 6.0.1 (#1542) ([7589343f](https://github.com/electron-userland/electron-forge/commit/7589343f))
  - bump webpack from 4.41.6 to 4.42.0 (#1540) ([99f2ccd4](https://github.com/electron-userland/electron-forge/commit/99f2ccd4))
  - bump inquirer from 7.0.4 to 7.0.5 (#1532) ([16d8331c](https://github.com/electron-userland/electron-forge/commit/16d8331c))
- have lint-staged only check changed files ([508727eb](https://github.com/electron-userland/electron-forge/commit/508727eb))
- update Heroku CLI repo key on Linux CI workers ([d838b8ed](https://github.com/electron-userland/electron-forge/commit/d838b8ed))

##### Chores

- **deps-dev:** upgrade @babel/{core,preset-env,register} to 7.8.6 ([ff3a2a7a](https://github.com/electron-userland/electron-forge/commit/ff3a2a7a))

##### Documentation Changes

- clean up README wording (#1625) ([3ad264df](https://github.com/electron-userland/electron-forge/commit/3ad264df))
- add note about conventional commits to the pull request docs ([155b739f](https://github.com/electron-userland/electron-forge/commit/155b739f))

##### New Features

- **s3:** add options to allow use custom instance (#1601) ([38e63d15](https://github.com/electron-userland/electron-forge/commit/38e63d15))

##### Bug Fixes

- **cli:** fix the minimum version of Node in the CLI error message ([45ac8ddf](https://github.com/electron-userland/electron-forge/commit/45ac8ddf))
- **core:** overrideTargets inherit the named maker config in the Forge config (#1549) ([e133b607](https://github.com/electron-userland/electron-forge/commit/e133b607))
- **publisher-electron-release-server:** throw an exception for 4xx/5xx HTTP status codes (#1538) ([f223fc8f](https://github.com/electron-userland/electron-forge/commit/f223fc8f))
- **template-base:** update Travis CI config to best practices (#1539) ([a34656b2](https://github.com/electron-userland/electron-forge/commit/a34656b2))
- **plugin-webpack:** change preload target from electron-renderer to electron-preload (#1521) ([5f1b240f](https://github.com/electron-userland/electron-forge/commit/5f1b240f))

#### [6.0.0-beta.50](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.50) (2020-02-25)

##### Build System / Dependencies

- **deps-dev:**
  - upgrade @types/sinon to 7.5.2 ([26f58633](https://github.com/electron-userland/electron-forge/commit/26f58633))
  - upgrade @types/node to 13.7.5 ([75c14c57](https://github.com/electron-userland/electron-forge/commit/75c14c57))
  - bump @types/node-fetch from 2.5.4 to 2.5.5 ([9f55a6c9](https://github.com/electron-userland/electron-forge/commit/9f55a6c9))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.21.0 ([b00446fa](https://github.com/electron-userland/electron-forge/commit/b00446fa))
  - bump typescript from 3.7.5 to 3.8.2 ([dcaa3c2e](https://github.com/electron-userland/electron-forge/commit/dcaa3c2e))
  - bump eslint-plugin-mocha from 6.2.2 to 6.3.0 ([0cb70c23](https://github.com/electron-userland/electron-forge/commit/0cb70c23))
  - bump @types/node from 13.7.2 to 13.7.4 ([3354084e](https://github.com/electron-userland/electron-forge/commit/3354084e))
  - bump sinon from 8.1.1 to 9.0.0 (#1505) ([da87172e](https://github.com/electron-userland/electron-forge/commit/da87172e))
  - upgrade asar to 2.1.0 (#1504) ([53ce8149](https://github.com/electron-userland/electron-forge/commit/53ce8149))
  - bump @types/node from 13.7.1 to 13.7.2 ([a5c5084a](https://github.com/electron-userland/electron-forge/commit/a5c5084a))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.20.0 ([167e4f2d](https://github.com/electron-userland/electron-forge/commit/167e4f2d))
  - bump @types/fs-extra from 8.0.1 to 8.1.0 ([5a9444dc](https://github.com/electron-userland/electron-forge/commit/5a9444dc))
  - upgrade typedoc to 0.16.10 ([ff3863a3](https://github.com/electron-userland/electron-forge/commit/ff3863a3))
  - bump @types/chai from 4.2.8 to 4.2.9 ([d4e44ab7](https://github.com/electron-userland/electron-forge/commit/d4e44ab7))
  - bump @types/node from 13.7.0 to 13.7.1 ([2d112566](https://github.com/electron-userland/electron-forge/commit/2d112566))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.19.2 ([a4ef9b47](https://github.com/electron-userland/electron-forge/commit/a4ef9b47))
  - upgrade @types/webpack to 4.41.6 ([ec1256df](https://github.com/electron-userland/electron-forge/commit/ec1256df))
  - upgrade codecov to 3.6.5 ([2e7dcda5](https://github.com/electron-userland/electron-forge/commit/2e7dcda5))
  - upgrade rimraf to 3.0.2 ([3e39cf7b](https://github.com/electron-userland/electron-forge/commit/3e39cf7b))
- **deps:**
  - upgrade @electron/get to 1.8.0 ([a15eb934](https://github.com/electron-userland/electron-forge/commit/a15eb934))
  - upgrade electron-installer-common to 0.10.1 ([d015bab7](https://github.com/electron-userland/electron-forge/commit/d015bab7))
  - bump pretty-ms from 5.1.0 to 6.0.0 (#1495) ([fe800f64](https://github.com/electron-userland/electron-forge/commit/fe800f64))
  - bump semver from 7.1.2 to 7.1.3 (#1490) ([8a7c8c5c](https://github.com/electron-userland/electron-forge/commit/8a7c8c5c))
  - bump webpack from 4.41.5 to 4.41.6 (#1494) ([196def64](https://github.com/electron-userland/electron-forge/commit/196def64))
  - bump @electron/get from 1.7.5 to 1.7.6 (#1493) ([1b1efe86](https://github.com/electron-userland/electron-forge/commit/1b1efe86))
  - bump xterm-addon-search from 0.4.0 to 0.5.0 (#1489) ([edda336d](https://github.com/electron-userland/electron-forge/commit/edda336d))
  - upgrade @electron/get to 1.7.5 ([ffe4a050](https://github.com/electron-userland/electron-forge/commit/ffe4a050))
  - upgrade electron-packager to 14.2.1 ([3f1c9590](https://github.com/electron-userland/electron-forge/commit/3f1c9590))
  - bump @octokit/rest from 16.42.2 to 16.43.1 (#1471) ([60c0f07b](https://github.com/electron-userland/electron-forge/commit/60c0f07b))
- emit Node 10 compatible code ([53a824a5](https://github.com/electron-userland/electron-forge/commit/53a824a5))

##### Chores

- changes to TypeScript files have eslint --fix run on them (#1516) ([dcf3bb18](https://github.com/electron-userland/electron-forge/commit/dcf3bb18))
- ignore yarn.lock in subdirectories ([76217769](https://github.com/electron-userland/electron-forge/commit/76217769))

##### Bug Fixes

- **core:** throw an error when no make targets for the given platform are found (#1515) ([bc370aab](https://github.com/electron-userland/electron-forge/commit/bc370aab))
- **typescript-webpack:** remove async=false option from ts-checker to avoid preload compile hang (#1497) ([fe5b33c9](https://github.com/electron-userland/electron-forge/commit/fe5b33c9))

##### Refactors

- use @malept/cross-spawn-promise instead of cross-spawn-promise (#1496) ([62998e5c](https://github.com/electron-userland/electron-forge/commit/62998e5c))

#### [6.0.0-beta.49](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.49) (2020-02-06)

##### Build System / Dependencies

- **deps:**
  - bump xterm from 4.3.0 to 4.4.0 (#1474) ([b1f3b722](https://github.com/electron-userland/electron-forge/commit/b1f3b722))
  - bump commander from 4.1.0 to 4.1.1 (#1470) ([ab1f3e00](https://github.com/electron-userland/electron-forge/commit/ab1f3e00))
  - upgrade transitive dependency node-abi to 2.14.0 ([bd708083](https://github.com/electron-userland/electron-forge/commit/bd708083))
- **deps-dev:**
  - bump @types/webpack from 4.41.4 to 4.41.5 ([3c914539](https://github.com/electron-userland/electron-forge/commit/3c914539))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.19.0 ([e1a3b02e](https://github.com/electron-userland/electron-forge/commit/e1a3b02e))

##### Bug Fixes

- **plugin-webpack:** lazily load config generator so isProd is set correctly (#1480) ([9f6a445c](https://github.com/electron-userland/electron-forge/commit/9f6a445c))

#### [6.0.0-beta.48](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.48) (2020-02-03)

##### Build System / Dependencies

- **deps:**
  - bump @octokit/rest from 16.41.1 to 16.42.2 (#1465) ([0193c277](https://github.com/electron-userland/electron-forge/commit/0193c277))
  - upgrade @octokit/rest to 16.41.1 ([37ae0060](https://github.com/electron-userland/electron-forge/commit/37ae0060))
  - upgrade open to 7.0.2 ([45240a87](https://github.com/electron-userland/electron-forge/commit/45240a87))
  - bump semver from 7.1.1 to 7.1.2 (#1458) ([b29b74a3](https://github.com/electron-userland/electron-forge/commit/b29b74a3))
  - bump @octokit/rest from 16.40.1 to 16.41.0 (#1460) ([205d3ef4](https://github.com/electron-userland/electron-forge/commit/205d3ef4))
  - bump open from 7.0.0 to 7.0.1 (#1454) ([a167fd36](https://github.com/electron-userland/electron-forge/commit/a167fd36))
  - upgrade electron-rebuild to 1.10.0 ([fc2a0574](https://github.com/electron-userland/electron-forge/commit/fc2a0574))
  - bump @octokit/rest from 16.39.0 to 16.40.1 (#1448) ([cf725c56](https://github.com/electron-userland/electron-forge/commit/cf725c56))
  - bump @octokit/rest from 16.38.2 to 16.39.0 (#1434) ([e63a0323](https://github.com/electron-userland/electron-forge/commit/e63a0323))
  - bump inquirer from 7.0.3 to 7.0.4 (#1437) ([f8a6f44c](https://github.com/electron-userland/electron-forge/commit/f8a6f44c))
  - upgrade @octokit/rest to 16.38.2 ([76d01ac9](https://github.com/electron-userland/electron-forge/commit/76d01ac9))
  - bump @octokit/rest from 16.37.0 to 16.38.1 (#1430) ([966cf49d](https://github.com/electron-userland/electron-forge/commit/966cf49d))
  - upgrade to electron-rebuild 1.9.0 ([c18c6596](https://github.com/electron-userland/electron-forge/commit/c18c6596))
  - upgrade electron-installer-redhat to ^3.0.0 ([d07a203f](https://github.com/electron-userland/electron-forge/commit/d07a203f))
  - upgrade electron-installer-debian to ^3.0.0 ([c790a6ba](https://github.com/electron-userland/electron-forge/commit/c790a6ba))
  - upgrade @malept/electron-installer-flatpak to 0.11.1 ([0e2ea612](https://github.com/electron-userland/electron-forge/commit/0e2ea612))
  - upgrade electron-installer-snap to ^5.0.0 ([7d289d98](https://github.com/electron-userland/electron-forge/commit/7d289d98))
  - bump @octokit/rest from 16.36.0 to 16.37.0 (#1426) ([b6dcb011](https://github.com/electron-userland/electron-forge/commit/b6dcb011))
  - upgrade transient dependencies ([14a8d224](https://github.com/electron-userland/electron-forge/commit/14a8d224))
  - upgrade cross-zip to ^3.0.0 ([f3aa4ac6](https://github.com/electron-userland/electron-forge/commit/f3aa4ac6))
  - upgrade commander to 4.1.0 ([20660e17](https://github.com/electron-userland/electron-forge/commit/20660e17))
  - upgrade mime-types to 2.1.26 ([21896a92](https://github.com/electron-userland/electron-forge/commit/21896a92))
  - bump electron-packager from 14.1.1 to 14.2.0 (#1400) ([f27b2558](https://github.com/electron-userland/electron-forge/commit/f27b2558))
  - bump @octokit/rest from 16.35.2 to 16.36.0 (#1397) ([834f5c0a](https://github.com/electron-userland/electron-forge/commit/834f5c0a))
  - bump inquirer from 7.0.0 to 7.0.3 (#1350) ([11e9e163](https://github.com/electron-userland/electron-forge/commit/11e9e163))
  - bump webpack from 4.41.2 to 4.41.5 (#1367) ([226ee45d](https://github.com/electron-userland/electron-forge/commit/226ee45d))
- ensure Yarn repo key is up-to-date ([c11fdaa7](https://github.com/electron-userland/electron-forge/commit/c11fdaa7))
- use actions/checkout@v2 ([ee8ee0f1](https://github.com/electron-userland/electron-forge/commit/ee8ee0f1))
- cache yarn directory instead of node_modules (#1404) ([ded1a5ff](https://github.com/electron-userland/electron-forge/commit/ded1a5ff))
- integrate Dependabolt job into CI (#1403) ([bb0b3dc9](https://github.com/electron-userland/electron-forge/commit/bb0b3dc9))
- re-enable the macOS/yarn CI tests ([7519befe](https://github.com/electron-userland/electron-forge/commit/7519befe))
- add support for specifying a custom glob with the test runner ([2dc04018](https://github.com/electron-userland/electron-forge/commit/2dc04018))
- **deps-dev:**
  - upgrade @types/webpack to 4.41.4 & @types/html-webpack-plugin to 3.2.2 ([63e52f0d](https://github.com/electron-userland/electron-forge/commit/63e52f0d))
  - upgrade @types/node to 13.7.0 ([7461586a](https://github.com/electron-userland/electron-forge/commit/7461586a))
  - upgrade codecov to 3.6.4 ([3344e4b3](https://github.com/electron-userland/electron-forge/commit/3344e4b3))
  - upgrade eslint-plugin-import to 2.20.1 ([41fee16d](https://github.com/electron-userland/electron-forge/commit/41fee16d))
  - upgrade @babel/{core,cli,preset-env} to 7.8.4 ([b5c25413](https://github.com/electron-userland/electron-forge/commit/b5c25413))
  - bump @types/mocha from 5.2.7 to 7.0.1 ([cde6399b](https://github.com/electron-userland/electron-forge/commit/cde6399b))
  - bump @types/node from 13.5.2 to 13.5.3 ([201f702c](https://github.com/electron-userland/electron-forge/commit/201f702c))
  - bump @types/chai from 4.2.7 to 4.2.8 ([feaf3d52](https://github.com/electron-userland/electron-forge/commit/feaf3d52))
  - bump @types/node from 13.5.1 to 13.5.2 ([95f71f98](https://github.com/electron-userland/electron-forge/commit/95f71f98))
  - upgrade @types/semver to ^7.1.0 ([14b7d884](https://github.com/electron-userland/electron-forge/commit/14b7d884))
  - upgrade @types/node to 13.5.1 ([422f454f](https://github.com/electron-userland/electron-forge/commit/422f454f))
  - bump rimraf from 3.0.0 to 3.0.1 ([d5253af2](https://github.com/electron-userland/electron-forge/commit/d5253af2))
  - upgrade @typescript-eslint packages to 2.18.0 ([9905be6d](https://github.com/electron-userland/electron-forge/commit/9905be6d))
  - bump mocha from 7.0.0 to 7.0.1 (#1436) ([bf8d58d4](https://github.com/electron-userland/electron-forge/commit/bf8d58d4))
  - bump cross-env from 6.0.3 to 7.0.0 ([952f0b5d](https://github.com/electron-userland/electron-forge/commit/952f0b5d))
  - bump typedoc from 0.16.8 to 0.16.9 (#1433) ([ee0d806f](https://github.com/electron-userland/electron-forge/commit/ee0d806f))
  - upgrade fetch-mock to 8.3.2 ([685f0a0a](https://github.com/electron-userland/electron-forge/commit/685f0a0a))
  - upgrade codecov to 3.6.2 ([b65ec57e](https://github.com/electron-userland/electron-forge/commit/b65ec57e))
  - upgrade sinon to 8.1.1 ([6c5b9f2d](https://github.com/electron-userland/electron-forge/commit/6c5b9f2d))
  - upgrade typedoc to ^0.16.8 ([e98a2ee0](https://github.com/electron-userland/electron-forge/commit/e98a2ee0))
  - upgrade @types/webpack to 4.41.3 ([a6c98fd0](https://github.com/electron-userland/electron-forge/commit/a6c98fd0))
  - upgrade typescript-eslint packages to 2.17.0 ([0a3900eb](https://github.com/electron-userland/electron-forge/commit/0a3900eb))
  - bump @types/node from 13.1.7 to 13.1.8 ([0eb14589](https://github.com/electron-userland/electron-forge/commit/0eb14589))
  - bump typescript from 3.7.4 to 3.7.5 (#1423) ([06195e4c](https://github.com/electron-userland/electron-forge/commit/06195e4c))
  - bump sinon from 8.0.4 to 8.1.0 (#1422) ([d9a2197d](https://github.com/electron-userland/electron-forge/commit/d9a2197d))
  - bump typedoc from 0.16.6 to 0.16.7 (#1420) ([bf73f374](https://github.com/electron-userland/electron-forge/commit/bf73f374))
  - upgrade mocha to ^7.0.0 ([cfbd7bf7](https://github.com/electron-userland/electron-forge/commit/cfbd7bf7))
  - upgrade typedoc to ^0.16.6 ([13075b78](https://github.com/electron-userland/electron-forge/commit/13075b78))
  - upgrade typescript to 3.7.4 ([71fd34a2](https://github.com/electron-userland/electron-forge/commit/71fd34a2))
  - upgrade typescript-eslint packages to 2.16.0 ([c98fb2cf](https://github.com/electron-userland/electron-forge/commit/c98fb2cf))
  - upgrade eslint-plugin-import to 2.20.0 ([311c75d3](https://github.com/electron-userland/electron-forge/commit/311c75d3))
  - upgrade nyc to ^15.0.0 & @istanbuljs/nyc-config-typescript to ^1.0.1 ([03f797bb](https://github.com/electron-userland/electron-forge/commit/03f797bb))
  - bump sinon from 7.5.0 to 8.0.4 (#1399) ([23f02cc8](https://github.com/electron-userland/electron-forge/commit/23f02cc8))
  - bump fetch-mock from 8.0.1 to 8.3.1 (#1347) ([219385ce](https://github.com/electron-userland/electron-forge/commit/219385ce))
  - bump ts-node from 8.5.4 to 8.6.2 (#1391) ([1512bb71](https://github.com/electron-userland/electron-forge/commit/1512bb71))
  - bump eslint from 6.7.2 to 6.8.0 (#1398) ([3cd7c28b](https://github.com/electron-userland/electron-forge/commit/3cd7c28b))
  - upgrade babel packages to 7.8.3 ([42269942](https://github.com/electron-userland/electron-forge/commit/42269942))
  - bump @types/node from 12.12.20 to 13.1.5 ([4883037b](https://github.com/electron-userland/electron-forge/commit/4883037b))
  - bump @types/node from 12.12.18 to 12.12.20 ([9b8a2a6a](https://github.com/electron-userland/electron-forge/commit/9b8a2a6a))
- **dev-deps:** upgrade @types/webpack to 4.41.2 ([062af9c9](https://github.com/electron-userland/electron-forge/commit/062af9c9))

##### Chores

- upgrade dependabolt to 2.1.1 ([6b6476dc](https://github.com/electron-userland/electron-forge/commit/6b6476dc))
- bump minimum Node version to 10 (#1405) ([01905382](https://github.com/electron-userland/electron-forge/commit/01905382))
- ignore nyc coverage folders ([9bf28caf](https://github.com/electron-userland/electron-forge/commit/9bf28caf))

##### New Features

- **plugin-webpack:** add an option to export webpack compilation stats (#639) ([7275f390](https://github.com/electron-userland/electron-forge/commit/7275f390))

##### Bug Fixes

- **template:** stop holding a reference to mainWindow (#1468) ([af8be3f0](https://github.com/electron-userland/electron-forge/commit/af8be3f0))
- **core:** find electron when app is in a yarn workspace (#1450) ([8613386d](https://github.com/electron-userland/electron-forge/commit/8613386d))
- **template-typescript-webpack:** adjust ts-loader module rule syntax (#1388) ([1df98710](https://github.com/electron-userland/electron-forge/commit/1df98710))
- **web-multi-logger:** xterm 4 compatibility (#1387) ([9f66342a](https://github.com/electron-userland/electron-forge/commit/9f66342a))

##### Refactors

- migrate templates from using tslint to eslint (#1467) ([37431b3c](https://github.com/electron-userland/electron-forge/commit/37431b3c))
- consolidate lodash dependencies (#1464) ([8693a1ef](https://github.com/electron-userland/electron-forge/commit/8693a1ef))
- **plugin-webpack:**
  - cast HtmlWebpackPlugin as webpack.Plugin ([2ab4a761](https://github.com/electron-userland/electron-forge/commit/2ab4a761))
  - move webpack config generation code to its own file (#1401) ([a7d93bb3](https://github.com/electron-userland/electron-forge/commit/a7d93bb3))
- **core:** avoid forEach and increase test coverage for forge-config (#1395) ([4db41a48](https://github.com/electron-userland/electron-forge/commit/4db41a48))

##### Tests

- **plugin-webpack:** add tests for resolveForgeConfig (#1447) ([2c6e233f](https://github.com/electron-userland/electron-forge/commit/2c6e233f))

#### [6.0.0-beta.47](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.47) (2019-12-18)

##### Build System / Dependencies

- **deps-dev:**
  - upgrade typescript-eslint modules to 2.12.0 ([2e72ddf4](https://github.com/electron-userland/electron-forge/commit/2e72ddf4))
  - bump typedoc from 0.15.4 to 0.15.5 ([1cf3c47e](https://github.com/electron-userland/electron-forge/commit/1cf3c47e))
  - bump @types/node from 12.12.17 to 12.12.18 ([b939452f](https://github.com/electron-userland/electron-forge/commit/b939452f))
  - upgrade asar to 2.0.3 ([d92434d0](https://github.com/electron-userland/electron-forge/commit/d92434d0))
  - bump nodemon from 2.0.1 to 2.0.2 ([29470fb0](https://github.com/electron-userland/electron-forge/commit/29470fb0))
  - bump @types/webpack-hot-middleware ([006d62fc](https://github.com/electron-userland/electron-forge/commit/006d62fc))
  - bump @types/node from 12.12.16 to 12.12.17 ([4484eec9](https://github.com/electron-userland/electron-forge/commit/4484eec9))
  - bump @types/chai from 4.2.6 to 4.2.7 ([083cbe87](https://github.com/electron-userland/electron-forge/commit/083cbe87))
  - upgrade typedoc to 0.15.4 ([afa5e0a5](https://github.com/electron-userland/electron-forge/commit/afa5e0a5))
  - upgrade some eslint plugins ([a9a80684](https://github.com/electron-userland/electron-forge/commit/a9a80684))
  - upgrade @types/node to 12.12.16 ([4ebf49dd](https://github.com/electron-userland/electron-forge/commit/4ebf49dd))
  - upgrade babel packages to latest 7.7.x version ([5e9667a6](https://github.com/electron-userland/electron-forge/commit/5e9667a6))
  - bump fetch-mock from 8.0.0 to 8.0.1 (#1322) ([bb72f662](https://github.com/electron-userland/electron-forge/commit/bb72f662))
  - bump typescript from 3.7.2 to 3.7.3 ([e7c3cb34](https://github.com/electron-userland/electron-forge/commit/e7c3cb34))
- fix CI codecov step conditional ([66bd0e2a](https://github.com/electron-userland/electron-forge/commit/66bd0e2a))
- disable docs CI step until NOW_TOKEN is defined (#1343) ([40f6b990](https://github.com/electron-userland/electron-forge/commit/40f6b990))
- fix up eslint config for imports + typescript ([d3fc0770](https://github.com/electron-userland/electron-forge/commit/d3fc0770))
- **deps:**
  - upgrade @octokit/rest to 16.35.2 ([f1412e5f](https://github.com/electron-userland/electron-forge/commit/f1412e5f))
  - upgrade @electron/get to 1.7.2 ([603fca9c](https://github.com/electron-userland/electron-forge/commit/603fca9c))
  - upgrade dependencies of webpack ([8870594a](https://github.com/electron-userland/electron-forge/commit/8870594a))
  - upgrade xterm to 4.3.0 ([beefaf1f](https://github.com/electron-userland/electron-forge/commit/beefaf1f))

##### Chores

- disable macOS/npm tests due to weirdness with fsevents ([01c417da](https://github.com/electron-userland/electron-forge/commit/01c417da))
- use the already-installed WiX installer to install the WiX toolset ([371a068a](https://github.com/electron-userland/electron-forge/commit/371a068a))

##### New Features

- add typescript-webpack template (#1344) ([7c8259dd](https://github.com/electron-userland/electron-forge/commit/7c8259dd))
- add template for typescript (#1319) ([cece7da7](https://github.com/electron-userland/electron-forge/commit/cece7da7))

##### Bug Fixes

- **plugin-webpack:** handle package.json files without config keys (#1342) ([4db53f89](https://github.com/electron-userland/electron-forge/commit/4db53f89))
- **core:** use loadFile instead of loadURL in the default template (#1341) ([51fbf715](https://github.com/electron-userland/electron-forge/commit/51fbf715))

##### Refactors

- **core:** remove unused config-fn utility file ([40c13d3a](https://github.com/electron-userland/electron-forge/commit/40c13d3a))
- create base template & test utils (#1351) ([3e5a64c0](https://github.com/electron-userland/electron-forge/commit/3e5a64c0))
- create the ElectronProcess type (ChildProcess + restarted property) (#1346) ([abbf0311](https://github.com/electron-userland/electron-forge/commit/abbf0311))
- replace indexOf with includes/startsWith where applicable (#1337) ([a3eae4df](https://github.com/electron-userland/electron-forge/commit/a3eae4df))
- **template-typescript:** use main script to start app (#1345) ([ef0b2baf](https://github.com/electron-userland/electron-forge/commit/ef0b2baf))

##### Tests

- **template-typescript:** run lint for template & adjust default rules (#1321) ([a83b46cd](https://github.com/electron-userland/electron-forge/commit/a83b46cd))

#### [6.0.0-beta.46](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.46) (2019-12-04)

##### Build System / Dependencies

- **deps-dev:**
  - bump @types/chai from 4.2.5 to 4.2.6 ([41b38743](https://github.com/electron-userland/electron-forge/commit/41b38743))
  - upgrade @typescript-eslint packages to 2.10.0 ([7b20fcf5](https://github.com/electron-userland/electron-forge/commit/7b20fcf5))
  - bump ts-node from 8.5.2 to 8.5.4 (#1310) ([fa99c527](https://github.com/electron-userland/electron-forge/commit/fa99c527))
  - bump eslint from 6.7.1 to 6.7.2 (#1313) ([a7941b54](https://github.com/electron-userland/electron-forge/commit/a7941b54))
  - upgrade @typescript-eslint packages to 2.9.0 ([93745109](https://github.com/electron-userland/electron-forge/commit/93745109))
  - upgrade @types/node to 12.12.14 ([ca728a44](https://github.com/electron-userland/electron-forge/commit/ca728a44))
  - bump eslint from 6.7.0 to 6.7.1 (#1302) ([a2de8ea5](https://github.com/electron-userland/electron-forge/commit/a2de8ea5))
  - bump @types/node-fetch from 2.5.2 to 2.5.3 ([ee2a403d](https://github.com/electron-userland/electron-forge/commit/ee2a403d))
  - bump @types/express from 4.17.1 to 4.17.2 ([3702255e](https://github.com/electron-userland/electron-forge/commit/3702255e))
  - bump @types/sinon from 7.5.0 to 7.5.1 ([5238748b](https://github.com/electron-userland/electron-forge/commit/5238748b))
  - bump nodemon from 1.19.4 to 2.0.0 ([d0877e0c](https://github.com/electron-userland/electron-forge/commit/d0877e0c))
- distinguish between coverage for different CI workers ([f4a90077](https://github.com/electron-userland/electron-forge/commit/f4a90077))
- use v2 of dependabolt (#1160) ([23a629d3](https://github.com/electron-userland/electron-forge/commit/23a629d3))
- **deps:**
  - bump electron-osx-sign from 0.4.14 to 0.4.15 (#1309) ([513e0a5d](https://github.com/electron-userland/electron-forge/commit/513e0a5d))
  - bump form-data from 2.5.1 to 3.0.0 (#1296) ([8405e1ba](https://github.com/electron-userland/electron-forge/commit/8405e1ba))
  - bump which from 2.0.1 to 2.0.2 (#1293) ([b5b2ad56](https://github.com/electron-userland/electron-forge/commit/b5b2ad56))
  - bump mime-types from 2.1.24 to 2.1.25 (#1298) ([622c3b8c](https://github.com/electron-userland/electron-forge/commit/622c3b8c))
  - bump ora from 4.0.2 to 4.0.3 (#1297) ([f93e706e](https://github.com/electron-userland/electron-forge/commit/f93e706e))
  - bump commander from 3.0.2 to 4.0.1 (#1290) ([384cb90b](https://github.com/electron-userland/electron-forge/commit/384cb90b))

##### Chores

- **cli:** fix lint warning ([704375c3](https://github.com/electron-userland/electron-forge/commit/704375c3))
- add separate types of issue templates, plus links to the community & website repo ([82560c41](https://github.com/electron-userland/electron-forge/commit/82560c41))
- **deps:**
  - upgrade dependencies ([ed8be390](https://github.com/electron-userland/electron-forge/commit/ed8be390))
  - upgrade electron-packager to 14.1.1 and @electron/get to 1.7.1 ([015cc386](https://github.com/electron-userland/electron-forge/commit/015cc386))
  - upgrade electron-installer-snap to 4.1.0 ([0879c2e2](https://github.com/electron-userland/electron-forge/commit/0879c2e2))
  - upgrade electron-packager, @malept/electron-installer-flatpak, & electron-wix-msi ([e1fbfe6a](https://github.com/electron-userland/electron-forge/commit/e1fbfe6a))
  - bump xterm from 4.1.0 to 4.2.0 (#1267) ([5f11002f](https://github.com/electron-userland/electron-forge/commit/5f11002f))
  - bump @octokit/rest from 16.33.1 to 16.35.0 (#1260) ([35ed2402](https://github.com/electron-userland/electron-forge/commit/35ed2402))
  - bump glob from 7.1.4 to 7.1.6 (#1252) ([8aad8548](https://github.com/electron-userland/electron-forge/commit/8aad8548))
  - bump sudo-prompt from 9.0.0 to 9.1.1 (#1289) ([c3c7fc35](https://github.com/electron-userland/electron-forge/commit/c3c7fc35))
  - [security] bump https-proxy-agent from 2.2.2 to 2.2.4 ([f6617a4c](https://github.com/electron-userland/electron-forge/commit/f6617a4c))
  - upgrade electron-rebuild to 1.8.8 ([915572b1](https://github.com/electron-userland/electron-forge/commit/915572b1))
  - update electron-rebuild dependencies ([32d9abf9](https://github.com/electron-userland/electron-forge/commit/32d9abf9))
  - bump open from 6.4.0 to 7.0.0 (#1242) ([ed112f2b](https://github.com/electron-userland/electron-forge/commit/ed112f2b))
  - bump webpack from 4.41.1 to 4.41.2 (#1241) ([bb7baf65](https://github.com/electron-userland/electron-forge/commit/bb7baf65))
  - bump @octokit/rest from 16.33.0 to 16.33.1 (#1237) ([dfa4a402](https://github.com/electron-userland/electron-forge/commit/dfa4a402))
  - bump webpack from 4.41.0 to 4.41.1 (#1236) ([422f16fa](https://github.com/electron-userland/electron-forge/commit/422f16fa))
  - bump @types/which from 1.3.1 to 1.3.2 ([c5f11d68](https://github.com/electron-userland/electron-forge/commit/c5f11d68))
  - bump @octokit/rest from 16.32.0 to 16.33.0 (#1227) ([007e34f1](https://github.com/electron-userland/electron-forge/commit/007e34f1))
  - bump cross-spawn from 7.0.0 to 7.0.1 (#1221) ([86182a98](https://github.com/electron-userland/electron-forge/commit/86182a98))
  - bump xterm from 4.0.2 to 4.1.0 (#1220) ([c3013b17](https://github.com/electron-userland/electron-forge/commit/c3013b17))
  - bump @octokit/rest from 16.30.2 to 16.32.0 (#1217) ([4691b91d](https://github.com/electron-userland/electron-forge/commit/4691b91d))
  - bump @octokit/rest from 16.30.1 to 16.30.2 (#1211) ([210d280f](https://github.com/electron-userland/electron-forge/commit/210d280f))
  - bump which from 1.3.1 to 2.0.1 (#1212) ([16ca1303](https://github.com/electron-userland/electron-forge/commit/16ca1303))
  - bump ora from 4.0.1 to 4.0.2 (#1203) ([85348b84](https://github.com/electron-userland/electron-forge/commit/85348b84))
  - bump webpack-dev-middleware from 3.7.1 to 3.7.2 (#1201) ([b5983a34](https://github.com/electron-userland/electron-forge/commit/b5983a34))
  - bump electron-osx-sign from 0.4.13 to 0.4.14 (#1194) ([eb67c47d](https://github.com/electron-userland/electron-forge/commit/eb67c47d))
  - bump commander from 3.0.1 to 3.0.2 (#1195) ([f246234a](https://github.com/electron-userland/electron-forge/commit/f246234a))
  - bump xterm from 4.0.1 to 4.0.2 (#1190) ([62dc2c05](https://github.com/electron-userland/electron-forge/commit/62dc2c05))
  - bump webpack from 4.40.2 to 4.41.0 (#1189) ([32bc411b](https://github.com/electron-userland/electron-forge/commit/32bc411b))
  - bump @octokit/rest from 16.30.0 to 16.30.1 (#1187) ([3acbc02c](https://github.com/electron-userland/electron-forge/commit/3acbc02c))
  - bump ora from 4.0.0 to 4.0.1 (#1182) ([6d0612b3](https://github.com/electron-userland/electron-forge/commit/6d0612b3))
  - bump ora from 3.4.0 to 4.0.0 (#1176) ([6199d9ff](https://github.com/electron-userland/electron-forge/commit/6199d9ff))
  - bump @octokit/rest from 16.29.0 to 16.30.0 (#1178) ([7cb85522](https://github.com/electron-userland/electron-forge/commit/7cb85522))
  - bump colors from 1.3.3 to 1.4.0 (#1177) ([c5284d0d](https://github.com/electron-userland/electron-forge/commit/c5284d0d))
  - bump @octokit/rest from 16.28.9 to 16.29.0 (#1169) ([bc60759f](https://github.com/electron-userland/electron-forge/commit/bc60759f))
  - bump webpack from 4.40.0 to 4.40.2 (#1162) ([599bf394](https://github.com/electron-userland/electron-forge/commit/599bf394))
  - bump xterm from 4.0.0 to 4.0.1 (#1156) ([9c8bfa71](https://github.com/electron-userland/electron-forge/commit/9c8bfa71))
  - bump webpack from 4.39.3 to 4.40.0 (#1155) ([5fc546d1](https://github.com/electron-userland/electron-forge/commit/5fc546d1))
  - upgrade electron-installer-debian to 2.0.1 ([6fc64c6d](https://github.com/electron-userland/electron-forge/commit/6fc64c6d))
  - bump xterm from 3.14.5 to 4.0.0 (#1151) ([e0606d0b](https://github.com/electron-userland/electron-forge/commit/e0606d0b))
  - bump electron-packager from 14.0.5 to 14.0.6 (#1148) ([3eece850](https://github.com/electron-userland/electron-forge/commit/3eece850))
  - bump electron-osx-sign from 0.4.12 to 0.4.13 (#1146) ([97fa43f5](https://github.com/electron-userland/electron-forge/commit/97fa43f5))
- **deps-dev:**
  - upgrade babel, typescript, & eslint dependencies ([e030285e](https://github.com/electron-userland/electron-forge/commit/e030285e))
  - upgrade fetch-mock to ^8.0.0 & @types/fetch-mock to 7.3.2 ([84997c3d](https://github.com/electron-userland/electron-forge/commit/84997c3d))
  - bump fetch-mock from 7.5.1 to 7.7.3 (#1268) ([38c32ca6](https://github.com/electron-userland/electron-forge/commit/38c32ca6))
  - bump eslint from 6.5.1 to 6.6.0 (#1265) ([ab6d9fa5](https://github.com/electron-userland/electron-forge/commit/ab6d9fa5))
  - bump @types/webpack from 4.39.4 to 4.41.0 (#1254) ([ea3d906d](https://github.com/electron-userland/electron-forge/commit/ea3d906d))
  - bump @types/chai from 4.2.3 to 4.2.5 ([756a6843](https://github.com/electron-userland/electron-forge/commit/756a6843))
  - bump @types/semver from 6.0.2 to 6.2.0 ([2553424e](https://github.com/electron-userland/electron-forge/commit/2553424e))
  - bump @types/node from 12.11.1 to 12.12.11 ([18881913](https://github.com/electron-userland/electron-forge/commit/18881913))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.5.0 ([bed3051f](https://github.com/electron-userland/electron-forge/commit/bed3051f))
  - bump mocha from 6.2.1 to 6.2.2 (#1248) ([f88b4b3e](https://github.com/electron-userland/electron-forge/commit/f88b4b3e))
  - bump @types/webpack from 4.39.3 to 4.39.4 ([9cc38ce7](https://github.com/electron-userland/electron-forge/commit/9cc38ce7))
  - bump @types/node from 12.7.12 to 12.11.1 ([adddb7ba](https://github.com/electron-userland/electron-forge/commit/adddb7ba))
  - bump @types/fs-extra from 8.0.0 to 8.0.1 (#1246) ([6c66c04b](https://github.com/electron-userland/electron-forge/commit/6c66c04b))
  - bump nodemon from 1.19.3 to 1.19.4 (#1243) ([4e5084a8](https://github.com/electron-userland/electron-forge/commit/4e5084a8))
  - bump eslint-plugin-mocha from 6.1.1 to 6.2.0 ([17198e1a](https://github.com/electron-userland/electron-forge/commit/17198e1a))
  - upgrade @typescript-eslint/{parser,eslint-plugin} to 2.4.0 ([c3628e51](https://github.com/electron-userland/electron-forge/commit/c3628e51))
  - bump @babel/cli from 7.6.3 to 7.6.4 ([844c7691](https://github.com/electron-userland/electron-forge/commit/844c7691))
  - bump @babel/core from 7.6.3 to 7.6.4 (#1234) ([e93b18b9](https://github.com/electron-userland/electron-forge/commit/e93b18b9))
  - bump @types/webpack from 4.39.2 to 4.39.3 ([139035e0](https://github.com/electron-userland/electron-forge/commit/139035e0))
  - bump @types/node from 12.7.9 to 12.7.12 (#1229) ([79331447](https://github.com/electron-userland/electron-forge/commit/79331447))
  - bump typescript from 3.6.3 to 3.6.4 ([e919abc7](https://github.com/electron-userland/electron-forge/commit/e919abc7))
  - bump @babel/core from 7.6.2 to 7.6.3 ([b2b8c6de](https://github.com/electron-userland/electron-forge/commit/b2b8c6de))
  - bump @babel/cli from 7.6.2 to 7.6.3 ([f0e01484](https://github.com/electron-userland/electron-forge/commit/f0e01484))
  - bump @babel/preset-env from 7.6.2 to 7.6.3 ([8b8a6185](https://github.com/electron-userland/electron-forge/commit/8b8a6185))
  - bump @typescript-eslint/eslint-plugin ([1389de91](https://github.com/electron-userland/electron-forge/commit/1389de91))
  - bump @typescript-eslint/parser from 2.3.2 to 2.3.3 ([8de1e5bd](https://github.com/electron-userland/electron-forge/commit/8de1e5bd))
  - bump @types/cross-spawn from 6.0.0 to 6.0.1 (#1218) ([80c5ad7e](https://github.com/electron-userland/electron-forge/commit/80c5ad7e))
  - bump fetch-mock from 7.4.0 to 7.5.1 (#1216) ([9d0c3dca](https://github.com/electron-userland/electron-forge/commit/9d0c3dca))
  - bump cross-env from 6.0.2 to 6.0.3 ([31cdd4b9](https://github.com/electron-userland/electron-forge/commit/31cdd4b9))
  - bump @typescript-eslint/eslint-plugin ([27a28ee4](https://github.com/electron-userland/electron-forge/commit/27a28ee4))
  - bump cross-env from 6.0.0 to 6.0.2 ([47490fa1](https://github.com/electron-userland/electron-forge/commit/47490fa1))
  - bump @types/sinon from 7.0.13 to 7.5.0 ([1bd50aa2](https://github.com/electron-userland/electron-forge/commit/1bd50aa2))
  - bump @types/node from 12.7.8 to 12.7.9 ([84140c00](https://github.com/electron-userland/electron-forge/commit/84140c00))
  - bump eslint from 6.5.0 to 6.5.1 ([0a106a75](https://github.com/electron-userland/electron-forge/commit/0a106a75))
  - bump @typescript-eslint/parser from 2.3.1 to 2.3.2 ([6246416a](https://github.com/electron-userland/electron-forge/commit/6246416a))
  - bump nodemon from 1.19.2 to 1.19.3 ([c4ee7381](https://github.com/electron-userland/electron-forge/commit/c4ee7381))
  - bump fetch-mock from 7.3.9 to 7.4.0 (#1202) ([0e3baafc](https://github.com/electron-userland/electron-forge/commit/0e3baafc))
  - bump @types/webpack from 4.39.1 to 4.39.2 ([f7b98791](https://github.com/electron-userland/electron-forge/commit/f7b98791))
  - bump mocha from 6.2.0 to 6.2.1 (#1198) ([49cec989](https://github.com/electron-userland/electron-forge/commit/49cec989))
  - bump eslint from 6.4.0 to 6.5.0 (#1197) ([5d11be6e](https://github.com/electron-userland/electron-forge/commit/5d11be6e))
  - bump @types/node from 12.7.7 to 12.7.8 ([b8ae8443](https://github.com/electron-userland/electron-forge/commit/b8ae8443))
  - bump @types/node from 12.7.5 to 12.7.7 ([6059c7df](https://github.com/electron-userland/electron-forge/commit/6059c7df))
  - bump @types/node-fetch from 2.5.1 to 2.5.2 ([493ff084](https://github.com/electron-userland/electron-forge/commit/493ff084))
  - bump sinon from 7.4.2 to 7.5.0 (#1185) ([d38c417b](https://github.com/electron-userland/electron-forge/commit/d38c417b))
  - upgrade @babel/_ to 7.6.2 and @typescript-eslint/_ to 2.3.1 ([fde7a4eb](https://github.com/electron-userland/electron-forge/commit/fde7a4eb))
  - bump codecov from 3.6.0 to 3.6.1 ([adb89354](https://github.com/electron-userland/electron-forge/commit/adb89354))
  - bump codecov from 3.5.0 to 3.6.0 ([f72f7483](https://github.com/electron-userland/electron-forge/commit/f72f7483))
  - bump @types/node-fetch from 2.5.0 to 2.5.1 ([f8a5715a](https://github.com/electron-userland/electron-forge/commit/f8a5715a))
  - bump cross-env from 5.2.1 to 6.0.0 ([6b2b71ab](https://github.com/electron-userland/electron-forge/commit/6b2b71ab))
  - bump @types/chai from 4.2.2 to 4.2.3 ([4d028f73](https://github.com/electron-userland/electron-forge/commit/4d028f73))
  - bump @typescript-eslint/eslint-plugin ([c64f043d](https://github.com/electron-userland/electron-forge/commit/c64f043d))
  - bump @typescript-eslint/parser from 2.2.0 to 2.3.0 ([3f4f62c3](https://github.com/electron-userland/electron-forge/commit/3f4f62c3))
  - bump ts-node from 8.3.0 to 8.4.1 (#1161) ([26920134](https://github.com/electron-userland/electron-forge/commit/26920134))
  - bump eslint from 6.3.0 to 6.4.0 (#1163) ([7d370e0f](https://github.com/electron-userland/electron-forge/commit/7d370e0f))
  - bump eslint-plugin-mocha from 6.1.0 to 6.1.1 ([c6895d15](https://github.com/electron-userland/electron-forge/commit/c6895d15))
  - bump @types/node from 12.7.4 to 12.7.5 ([14e0d393](https://github.com/electron-userland/electron-forge/commit/14e0d393))
  - bump typescript from 3.6.2 to 3.6.3 ([a18c5004](https://github.com/electron-userland/electron-forge/commit/a18c5004))
  - bump @babel/preset-typescript from 7.3.3 to 7.6.0 ([2ad170cd](https://github.com/electron-userland/electron-forge/commit/2ad170cd))
  - bump @typescript-eslint/parser from 2.1.0 to 2.2.0 ([98098515](https://github.com/electron-userland/electron-forge/commit/98098515))
  - bump @typescript-eslint/eslint-plugin ([05a72772](https://github.com/electron-userland/electron-forge/commit/05a72772))
  - bump @types/chai from 4.2.1 to 4.2.2 ([13506d6a](https://github.com/electron-userland/electron-forge/commit/13506d6a))
  - bump @babel/register from 7.5.5 to 7.6.0 ([acd2fbd6](https://github.com/electron-userland/electron-forge/commit/acd2fbd6))
  - bump @babel/preset-env from 7.5.5 to 7.6.0 ([af9cbee6](https://github.com/electron-userland/electron-forge/commit/af9cbee6))
  - bump @babel/core from 7.5.5 to 7.6.0 ([6229b0b1](https://github.com/electron-userland/electron-forge/commit/6229b0b1))
  - bump @babel/cli from 7.5.5 to 7.6.0 (#1141) ([2cd8c1b7](https://github.com/electron-userland/electron-forge/commit/2cd8c1b7))
  - bump @types/semver from 6.0.1 to 6.0.2 (#1139) ([d8284570](https://github.com/electron-userland/electron-forge/commit/d8284570))

##### Bug Fixes

- **maker-squirrel:** handle versions with prerelease information ([d4e402d3](https://github.com/electron-userland/electron-forge/commit/d4e402d3))
- **maker-wix:** handle versions with prerelease information ([be4b29f0](https://github.com/electron-userland/electron-forge/commit/be4b29f0))
- **cli:**
  - only run unknown command code when it's actually unknown ([771b0b04](https://github.com/electron-userland/electron-forge/commit/771b0b04))
  - warn on unknown commands (#1304) ([a0c15d94](https://github.com/electron-userland/electron-forge/commit/a0c15d94))
- **async-ora:** print the result of the timing function, not the function code ([1bcf036f](https://github.com/electron-userland/electron-forge/commit/1bcf036f))
- **maker-base:** throw a better error when external binaries are missing (#1306) ([c8baa1e5](https://github.com/electron-userland/electron-forge/commit/c8baa1e5))
- bump @electron/get from 1.5.0 to 1.7.0 & always enable proxy support in CLI (#1264) ([d65f33e7](https://github.com/electron-userland/electron-forge/commit/d65f33e7))

##### Refactors

- **maker-base:** extract Windows-specific version normalization to a method on the maker base class ([c3e2361e](https://github.com/electron-userland/electron-forge/commit/c3e2361e))
- **publisher-s3:** replace the s3 package with just aws-sdk (#1318) ([bbb0f901](https://github.com/electron-userland/electron-forge/commit/bbb0f901))

##### Tests

- **core:**
  - set makeVersionWinStoreCompatible for appx integration testing ([0aafbf61](https://github.com/electron-userland/electron-forge/commit/0aafbf61))
  - set the make version to a beta for more comprehensive testing ([33a68b09](https://github.com/electron-userland/electron-forge/commit/33a68b09))
  - use ref-napi instead of ref ([105efef2](https://github.com/electron-userland/electron-forge/commit/105efef2))
  - revert "use a more recent Electron version in rebuild tests" ([649f0e68](https://github.com/electron-userland/electron-forge/commit/649f0e68))
  - use a more recent Electron version in rebuild tests ([976133aa](https://github.com/electron-userland/electron-forge/commit/976133aa))
- remove rebuild tests that duplicate electron-rebuild (#1303) ([92817f4d](https://github.com/electron-userland/electron-forge/commit/92817f4d))
- switch to GitHub Actions CI (#1299) ([d8226038](https://github.com/electron-userland/electron-forge/commit/d8226038))
- **rebuild:** sync native modules with the ones used in the electron-rebuild testsuite ([bc0049ff](https://github.com/electron-userland/electron-forge/commit/bc0049ff))

#### [6.0.0-beta.45](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.45) (2019-09-05)

##### Build System / Dependencies

- pin now to a specific version to avoid bug ([90b79c25](https://github.com/electron-userland/electron-forge/commit/90b79c25))

##### Chores

- **deps:**
  - bump webpack-dev-middleware from 3.7.0 to 3.7.1 (#1137) ([c9597b31](https://github.com/electron-userland/electron-forge/commit/c9597b31))
  - bump @octokit/rest from 16.28.8 to 16.28.9 (#1135) ([faac3fc4](https://github.com/electron-userland/electron-forge/commit/faac3fc4))
  - bump cross-spawn from 6.0.5 to 7.0.0 (#1133) ([2a44e3da](https://github.com/electron-userland/electron-forge/commit/2a44e3da))
  - bump @octokit/rest from 16.28.7 to 16.28.8 (#1127) ([15edf18a](https://github.com/electron-userland/electron-forge/commit/15edf18a))
  - bump commander from 3.0.0 to 3.0.1 (#1126) ([aa8ae615](https://github.com/electron-userland/electron-forge/commit/aa8ae615))
  - bump form-data from 2.5.0 to 2.5.1 (#1121) ([402a1ae6](https://github.com/electron-userland/electron-forge/commit/402a1ae6))
  - bump electron-packager from 14.0.4 to 14.0.5 (#1118) ([d4a743a2](https://github.com/electron-userland/electron-forge/commit/d4a743a2))
  - bump webpack-merge from 4.2.1 to 4.2.2 (#1116) ([9bbc5204](https://github.com/electron-userland/electron-forge/commit/9bbc5204))
  - bump webpack from 4.39.2 to 4.39.3 (#1115) ([43640225](https://github.com/electron-userland/electron-forge/commit/43640225))
  - upgrade @electron/get to 1.5.0 ([04021bb3](https://github.com/electron-userland/electron-forge/commit/04021bb3))
  - [security] bump eslint-utils from 1.4.0 to 1.4.2 ([9ee48eef](https://github.com/electron-userland/electron-forge/commit/9ee48eef))
  - bump inquirer from 6.5.1 to 7.0.0 (#1106) ([2466c5d6](https://github.com/electron-userland/electron-forge/commit/2466c5d6))
  - bump electron-rebuild from 1.8.5 to 1.8.6 (#1097) ([17eedddb](https://github.com/electron-userland/electron-forge/commit/17eedddb))
  - upgrade yarn-or-npm to ^3.0.1 ([0a64ee36](https://github.com/electron-userland/electron-forge/commit/0a64ee36))
  - downgrade yarn-or-npm to ^2.0.4 due to a regression in 3.0.0 ([10a83d8b](https://github.com/electron-userland/electron-forge/commit/10a83d8b))
  - upgrade cross-zip to 2.1.6 ([4d1f83be](https://github.com/electron-userland/electron-forge/commit/4d1f83be))
  - bump webpack from 4.39.1 to 4.39.2 (#1092) ([f2a507eb](https://github.com/electron-userland/electron-forge/commit/f2a507eb))
- **deps-dev:**
  - bump nodemon from 1.19.1 to 1.19.2 (#1136) ([fcc9cca3](https://github.com/electron-userland/electron-forge/commit/fcc9cca3))
  - bump @types/chai from 4.2.0 to 4.2.1 ([30f383f1](https://github.com/electron-userland/electron-forge/commit/30f383f1))
  - bump @types/node from 12.7.3 to 12.7.4 ([8ef109ab](https://github.com/electron-userland/electron-forge/commit/8ef109ab))
  - bump @typescript-eslint/eslint-plugin ([278a9ebe](https://github.com/electron-userland/electron-forge/commit/278a9ebe))
  - bump sinon from 7.4.1 to 7.4.2 (#1128) ([2fd698b6](https://github.com/electron-userland/electron-forge/commit/2fd698b6))
  - bump @typescript-eslint/parser from 2.0.0 to 2.1.0 ([8a798dfc](https://github.com/electron-userland/electron-forge/commit/8a798dfc))
  - bump cross-env from 5.2.0 to 5.2.1 ([8dd7a453](https://github.com/electron-userland/electron-forge/commit/8dd7a453))
  - bump eslint from 6.2.2 to 6.3.0 (#1125) ([5a297d91](https://github.com/electron-userland/electron-forge/commit/5a297d91))
  - bump @types/node from 12.7.2 to 12.7.3 ([1ae253e4](https://github.com/electron-userland/electron-forge/commit/1ae253e4))
  - bump typescript from 3.5.3 to 3.6.2 ([b9b08dd0](https://github.com/electron-userland/electron-forge/commit/b9b08dd0))
  - bump eslint from 6.2.1 to 6.2.2 ([5bf51965](https://github.com/electron-userland/electron-forge/commit/5bf51965))
  - bump @types/webpack from 4.39.0 to 4.39.1 ([4c4e3d68](https://github.com/electron-userland/electron-forge/commit/4c4e3d68))
  - upgrade to ESLint 6 and friends (#1104) ([ef0b6630](https://github.com/electron-userland/electron-forge/commit/ef0b6630))
  - bump eslint-plugin-mocha from 6.0.0 to 6.1.0 ([a2d04f4e](https://github.com/electron-userland/electron-forge/commit/a2d04f4e))
  - bump @types/express from 4.17.0 to 4.17.1 ([79df0c47](https://github.com/electron-userland/electron-forge/commit/79df0c47))
  - bump @types/webpack from 4.32.1 to 4.39.0 ([1b3ae033](https://github.com/electron-userland/electron-forge/commit/1b3ae033))
  - upgrade @types/node to 12.7.2 ([f0aaba54](https://github.com/electron-userland/electron-forge/commit/f0aaba54))
  - upgrade rimraf to ^3.0.0 ([2ee24d23](https://github.com/electron-userland/electron-forge/commit/2ee24d23))
  - bump proxyquire from 2.1.2 to 2.1.3 (#1091) ([7eedab3e](https://github.com/electron-userland/electron-forge/commit/7eedab3e))
- add dependabolt GitHub Action workflow (#1123) ([3b005088](https://github.com/electron-userland/electron-forge/commit/3b005088))
- replace coveralls with codecov (#1016) ([b424380a](https://github.com/electron-userland/electron-forge/commit/b424380a))

##### Bug Fixes

- **plugin-webpack:** add missing debug level for webpack-dev-middleware (#1131) ([2d9eaa12](https://github.com/electron-userland/electron-forge/commit/2d9eaa12))
- **core:** only add stderr to exception if stderr exists ([b6cbc378](https://github.com/electron-userland/electron-forge/commit/b6cbc378))

##### Tests

- **core:**
  - fix custom template tests ([3cd44eb0](https://github.com/electron-userland/electron-forge/commit/3cd44eb0))
  - fix calls to expectProjectPathExists ([86ca42d4](https://github.com/electron-userland/electron-forge/commit/86ca42d4))

#### [6.0.0-beta.44](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.44) (2019-08-12)

##### Build System / Dependencies

- use Node 12 for the docs stage on Travis CI (#1057) ([fbbf9c8b](https://github.com/electron-userland/electron-forge/commit/fbbf9c8b))

##### Chores

- **deps:**
  - bump inquirer from 6.5.0 to 6.5.1 (#1089) ([c9bfa111](https://github.com/electron-userland/electron-forge/commit/c9bfa111))
  - bump commander from 2.20.0 to 3.0.0 (#1087) ([2a49fb06](https://github.com/electron-userland/electron-forge/commit/2a49fb06))
  - bump source-map-support from 0.5.12 to 0.5.13 (#1066) ([5d296cfc](https://github.com/electron-userland/electron-forge/commit/5d296cfc))
  - bump electron-packager from 14.0.3 to 14.0.4 (#1063) ([e41ab8df](https://github.com/electron-userland/electron-forge/commit/e41ab8df))
  - bump webpack from 4.37.0 to 4.39.1 (#1075) ([bcefe427](https://github.com/electron-userland/electron-forge/commit/bcefe427))
  - upgrade transitive dependencies ([db0e50f3](https://github.com/electron-userland/electron-forge/commit/db0e50f3))
  - upgrade @octokit/rest to 16.28.7 ([2b3da6e7](https://github.com/electron-userland/electron-forge/commit/2b3da6e7))
  - upgrade electron-osx-sign to 0.4.12 ([4c09d8b8](https://github.com/electron-userland/electron-forge/commit/4c09d8b8))
  - bump electron-packager from 14.0.2 to 14.0.3 (#1052) ([0c8beaf7](https://github.com/electron-userland/electron-forge/commit/0c8beaf7))
  - bump electron-winstaller from 3.0.4 to 4.0.0 (#1051) ([30532af1](https://github.com/electron-userland/electron-forge/commit/30532af1))
  - bump yarn-or-npm from 2.0.4 to 3.0.0 (#1054) ([71e27b7b](https://github.com/electron-userland/electron-forge/commit/71e27b7b))
  - bump semver from 6.2.0 to 6.3.0 (#1049) ([eb7151d2](https://github.com/electron-userland/electron-forge/commit/eb7151d2))
  - bump @octokit/rest from 16.28.4 to 16.28.5 (#1039) ([240c3241](https://github.com/electron-userland/electron-forge/commit/240c3241))
  - upgrade webpack to 4.37.0 ([e957915c](https://github.com/electron-userland/electron-forge/commit/e957915c))
- **deps-dev:**
  - bump proxyquire from 2.1.1 to 2.1.2 (#1090) ([cef4a58e](https://github.com/electron-userland/electron-forge/commit/cef4a58e))
  - bump @types/debug from 4.1.4 to 4.1.5 ([8482f936](https://github.com/electron-userland/electron-forge/commit/8482f936))
  - bump @types/inquirer from 6.0.3 to 6.5.0 ([799e8880](https://github.com/electron-userland/electron-forge/commit/799e8880))
  - bump @types/chai-as-promised from 7.1.0 to 7.1.2 (#1084) ([3a59c318](https://github.com/electron-userland/electron-forge/commit/3a59c318))
  - bump @types/node from 12.6.8 to 12.7.1 ([dbefd974](https://github.com/electron-userland/electron-forge/commit/dbefd974))
  - bump @types/listr from 0.14.1 to 0.14.2 ([f61cd42b](https://github.com/electron-userland/electron-forge/commit/f61cd42b))
  - bump sinon from 7.3.2 to 7.4.1 (#1076) ([5f116992](https://github.com/electron-userland/electron-forge/commit/5f116992))
  - bump typedoc from 0.14.2 to 0.15.0 ([aa65291f](https://github.com/electron-userland/electron-forge/commit/aa65291f))
  - bump @types/webpack from 4.32.0 to 4.32.1 ([b0c2beb1](https://github.com/electron-userland/electron-forge/commit/b0c2beb1))
  - bump @types/node-fetch from 2.3.7 to 2.5.0 (#1050) ([c1480c18](https://github.com/electron-userland/electron-forge/commit/c1480c18))
  - bump fetch-mock from 7.3.7 to 7.3.9 (#1043) ([e835f8e1](https://github.com/electron-userland/electron-forge/commit/e835f8e1))
  - upgrade eslint-plugin-react to 7.14.3 ([52f5d12b](https://github.com/electron-userland/electron-forge/commit/52f5d12b))
  - upgrade typescript-eslint packages to 1.13.0 ([d65f2a8b](https://github.com/electron-userland/electron-forge/commit/d65f2a8b))
  - bump @types/listr from 0.14.0 to 0.14.1 ([affc076d](https://github.com/electron-userland/electron-forge/commit/affc076d))
  - bump eslint-plugin-import from 2.18.0 to 2.18.2 ([acdf8428](https://github.com/electron-userland/electron-forge/commit/acdf8428))
  - bump mocha from 6.1.4 to 6.2.0 (#1038) ([8d0372c3](https://github.com/electron-userland/electron-forge/commit/8d0372c3))
  - bump eslint-plugin-mocha from 5.3.0 to 6.0.0 ([ce6d971b](https://github.com/electron-userland/electron-forge/commit/ce6d971b))
- update Babel Node target to 8 ([a0b5e1ed](https://github.com/electron-userland/electron-forge/commit/a0b5e1ed))

##### New Features

- **maker-base:** add a method to check for binaries required for a maker ([ec7db014](https://github.com/electron-userland/electron-forge/commit/ec7db014))

##### Bug Fixes

- ensure that makers do not overwrite existing un-similar outputs (#1086) ([dbc19d89](https://github.com/electron-userland/electron-forge/commit/dbc19d89))
- **maker:** allow Linux makers to run on non-Linux hosts if possible ([c67596bb](https://github.com/electron-userland/electron-forge/commit/c67596bb))

#### [6.0.0-beta.43](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.43) (2019-07-18)

##### Chores

- **deps-dev:**
  - upgrade dependencies ([71f89c28](https://github.com/electron-userland/electron-forge/commit/71f89c28))
  - remove now-unnecessary @types/pretty-ms ([a341e444](https://github.com/electron-userland/electron-forge/commit/a341e444))
  - upgrade babel devDependencies to 7.5.5 ([e9269602](https://github.com/electron-userland/electron-forge/commit/e9269602))
  - remove now-unnecessary @types/form-data ([ca6ed54d](https://github.com/electron-userland/electron-forge/commit/ca6ed54d))
  - upgrade @types/node to 12.6.6 ([c755c8a2](https://github.com/electron-userland/electron-forge/commit/c755c8a2))
- **deps:**
  - upgrade webpack to 4.36.1 ([5079a911](https://github.com/electron-userland/electron-forge/commit/5079a911))
  - upgrade Electron tooling transitive dependencies ([948b0803](https://github.com/electron-userland/electron-forge/commit/948b0803))
- clean up README and contributing docs ([5fb8e55f](https://github.com/electron-userland/electron-forge/commit/5fb8e55f))

##### New Features

- **core:** add a force flag to init to allow it to overwrite an existing directory (#1020) ([dcdc2a1c](https://github.com/electron-userland/electron-forge/commit/dcdc2a1c))

##### Bug Fixes

- **template-webpack:** use css-loader instead of file-loader (#1036) ([62b7c195](https://github.com/electron-userland/electron-forge/commit/62b7c195))
- **plugin-webpack:** adjust publicPath in renderer only (#1035) ([57ca285a](https://github.com/electron-userland/electron-forge/commit/57ca285a))

##### Refactors

- **core:** use Object.entries when mapping makeTargets in the v5 importer ([745e7689](https://github.com/electron-userland/electron-forge/commit/745e7689))

#### [6.0.0-beta.42](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.42) (2019-07-15)

##### Chores

- **deps:** upgrade @octokit/rest to 16.28.4 ([e1012fe1](https://github.com/electron-userland/electron-forge/commit/e1012fe1))
- **deps-dev:**
  - upgrade @types/form-data to 2.5.0 and @types/node to 12.6.3 ([7a1c0148](https://github.com/electron-userland/electron-forge/commit/7a1c0148))
  - upgrade proxyquire to 2.1.1 ([812bf56f](https://github.com/electron-userland/electron-forge/commit/812bf56f))
  - upgrade typescript-eslint packages to 1.12.0 ([6f242937](https://github.com/electron-userland/electron-forge/commit/6f242937))
  - bump @types/webpack from 4.4.34 to 4.4.35 ([ab1628a1](https://github.com/electron-userland/electron-forge/commit/ab1628a1))
  - bump @types/html-webpack-plugin from 3.2.0 to 3.2.1 ([1de1e3bd](https://github.com/electron-userland/electron-forge/commit/1de1e3bd))
- consistent use of Forge/Electron Forge in messages ([1d19b320](https://github.com/electron-userland/electron-forge/commit/1d19b320))

##### Bug Fixes

- **template-webpack:** properly remove stylesheet link from index.html ([89176b4d](https://github.com/electron-userland/electron-forge/commit/89176b4d))
- **plugin-webpack:** properly reference `index.js` in production (#1021) ([d70ae5c2](https://github.com/electron-userland/electron-forge/commit/d70ae5c2))

##### Refactors

- **template-webpack:**
  - extract rewrite template file function ([5b586063](https://github.com/electron-userland/electron-forge/commit/5b586063))
  - extract copy template file function ([cd638744](https://github.com/electron-userland/electron-forge/commit/cd638744))

#### [6.0.0-beta.41](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.41) (2019-07-13)

##### Bug Fixes

- **core:** copy index.css to a new project ([12fbbd08](https://github.com/electron-userland/electron-forge/commit/12fbbd08))

#### [6.0.0-beta.40](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.40) (2019-07-12)

##### Build System / Dependencies

- **deps-dev:**
  - bump fetch-mock from 7.3.3 to 7.3.6 (#1007) ([662b5ce2](https://github.com/electron-userland/electron-forge/commit/662b5ce2))
  - bump @babel/preset-env from 7.5.2 to 7.5.4 ([8aed6b70](https://github.com/electron-userland/electron-forge/commit/8aed6b70))
  - bump @types/node from 12.6.1 to 12.6.2 ([41c269d4](https://github.com/electron-userland/electron-forge/commit/41c269d4))
  - bump @babel/core from 7.5.0 to 7.5.4 ([938c3e75](https://github.com/electron-userland/electron-forge/commit/938c3e75))
  - bump typescript from 3.5.2 to 3.5.3 ([8082ca08](https://github.com/electron-userland/electron-forge/commit/8082ca08))
  - bump @babel/preset-env from 7.5.0 to 7.5.2 ([2fdf513f](https://github.com/electron-userland/electron-forge/commit/2fdf513f))
  - bump @types/node from 12.0.12 to 12.6.1 (#1000) ([362a7666](https://github.com/electron-userland/electron-forge/commit/362a7666))
  - bump @types/node from 12.0.10 to 12.0.12 ([fe44d331](https://github.com/electron-userland/electron-forge/commit/fe44d331))
  - bump eslint-config-airbnb from 17.1.0 to 17.1.1 ([c7cfc056](https://github.com/electron-userland/electron-forge/commit/c7cfc056))
  - bump eslint-plugin-jsx-a11y from 6.2.1 to 6.2.3 ([eedf5496](https://github.com/electron-userland/electron-forge/commit/eedf5496))
  - bump @types/electron-packager from 13.0.0 to 13.0.1 ([2656d0ca](https://github.com/electron-userland/electron-forge/commit/2656d0ca))
  - bump generate-changelog from 1.7.1 to 1.8.0 ([a07abbd6](https://github.com/electron-userland/electron-forge/commit/a07abbd6))
  - bump @types/webpack-dev-middleware from 2.0.2 to 2.0.3 ([e52eceec](https://github.com/electron-userland/electron-forge/commit/e52eceec))
  - bump @types/webpack from 4.4.33 to 4.4.34 ([98f3c0ad](https://github.com/electron-userland/electron-forge/commit/98f3c0ad))
  - bump eslint-plugin-react from 7.14.0 to 7.14.2 ([5c68634e](https://github.com/electron-userland/electron-forge/commit/5c68634e))
  - bump eslint-plugin-import from 2.17.3 to 2.18.0 ([cb5fca1f](https://github.com/electron-userland/electron-forge/commit/cb5fca1f))
  - bump @types/node from 12.0.8 to 12.0.10 ([4321f5fc](https://github.com/electron-userland/electron-forge/commit/4321f5fc))
  - bump eslint-plugin-react from 7.13.0 to 7.14.0 ([91c2bbdb](https://github.com/electron-userland/electron-forge/commit/91c2bbdb))
  - bump @types/semver from 6.0.0 to 6.0.1 ([0d09dacf](https://github.com/electron-userland/electron-forge/commit/0d09dacf))
  - bump @types/webpack from 4.4.32 to 4.4.33 ([07e24b9e](https://github.com/electron-userland/electron-forge/commit/07e24b9e))
  - bump @types/fetch-mock from 7.3.0 to 7.3.1 ([f5a7e461](https://github.com/electron-userland/electron-forge/commit/f5a7e461))
  - bump @types/node-fetch from 2.3.6 to 2.3.7 ([9e0e564b](https://github.com/electron-userland/electron-forge/commit/9e0e564b))
  - bump typescript from 3.5.1 to 3.5.2 ([a1fb73e3](https://github.com/electron-userland/electron-forge/commit/a1fb73e3))
  - bump @types/sinon from 7.0.12 to 7.0.13 ([7968ce87](https://github.com/electron-userland/electron-forge/commit/7968ce87))
  - bump @types/node-fetch from 2.3.5 to 2.3.6 ([b7ca5b04](https://github.com/electron-userland/electron-forge/commit/b7ca5b04))
  - bump @types/node from 12.0.7 to 12.0.8 ([b3fbca87](https://github.com/electron-userland/electron-forge/commit/b3fbca87))
  - bump @types/node-fetch from 2.3.4 to 2.3.5 ([76b7ac48](https://github.com/electron-userland/electron-forge/commit/76b7ac48))
  - bump @types/node from 12.0.5 to 12.0.7 ([dd3537d0](https://github.com/electron-userland/electron-forge/commit/dd3537d0))
  - bump @types/node from 12.0.4 to 12.0.5 ([18903ff6](https://github.com/electron-userland/electron-forge/commit/18903ff6))
  - bump coveralls from 3.0.3 to 3.0.4 ([6a14ca87](https://github.com/electron-userland/electron-forge/commit/6a14ca87))
  - bump @types/express from 4.16.1 to 4.17.0 ([63b7b2cf](https://github.com/electron-userland/electron-forge/commit/63b7b2cf))
  - bump @types/node from 12.0.3 to 12.0.4 ([62276fcb](https://github.com/electron-userland/electron-forge/commit/62276fcb))
  - bump @types/mocha from 5.2.6 to 5.2.7 ([8afc1eaf](https://github.com/electron-userland/electron-forge/commit/8afc1eaf))
  - bump typescript from 3.4.5 to 3.5.1 ([c8e62fb4](https://github.com/electron-userland/electron-forge/commit/c8e62fb4))
  - bump @types/node from 12.0.2 to 12.0.3 ([14a7ba84](https://github.com/electron-userland/electron-forge/commit/14a7ba84))
  - bump nodemon from 1.19.0 to 1.19.1 ([1d3da591](https://github.com/electron-userland/electron-forge/commit/1d3da591))
  - bump ts-node from 8.1.0 to 8.2.0 ([1fc358ff](https://github.com/electron-userland/electron-forge/commit/1fc358ff))
  - bump eslint-plugin-import from 2.17.2 to 2.17.3 ([c0b1fcff](https://github.com/electron-userland/electron-forge/commit/c0b1fcff))
  - bump @types/sinon from 7.0.11 to 7.0.12 ([3b02e6dc](https://github.com/electron-userland/electron-forge/commit/3b02e6dc))
  - bump @babel/core from 7.4.4 to 7.4.5 ([2de77412](https://github.com/electron-userland/electron-forge/commit/2de77412))
  - bump @types/webpack from 4.4.31 to 4.4.32 ([a43b977a](https://github.com/electron-userland/electron-forge/commit/a43b977a))
- **deps:**
  - bump @octokit/rest from 16.28.2 to 16.28.3 (#1005) ([27798941](https://github.com/electron-userland/electron-forge/commit/27798941))
  - bump webpack from 4.35.2 to 4.35.3 (#1001) ([03b82b3f](https://github.com/electron-userland/electron-forge/commit/03b82b3f))
  - bump form-data from 2.4.0 to 2.5.0 (#989) ([588d0581](https://github.com/electron-userland/electron-forge/commit/588d0581))
  - bump semver from 6.1.3 to 6.2.0 (#984) ([dbf23b23](https://github.com/electron-userland/electron-forge/commit/dbf23b23))
  - bump open from 6.3.0 to 6.4.0 (#982) ([9a969ac6](https://github.com/electron-userland/electron-forge/commit/9a969ac6))
  - bump xterm from 3.14.2 to 3.14.4 (#977) ([23e5863a](https://github.com/electron-userland/electron-forge/commit/23e5863a))
  - bump @electron/get from 1.3.0 to 1.3.1 ([dc952b77](https://github.com/electron-userland/electron-forge/commit/dc952b77))
  - bump inquirer from 6.4.0 to 6.4.1 (#966) ([263d1617](https://github.com/electron-userland/electron-forge/commit/263d1617))
  - bump semver from 6.1.1 to 6.1.2 (#965) ([ee82dd8d](https://github.com/electron-userland/electron-forge/commit/ee82dd8d))
  - bump inquirer from 6.3.1 to 6.4.0 (#955) ([bd64ce7d](https://github.com/electron-userland/electron-forge/commit/bd64ce7d))
  - bump webpack from 4.34.0 to 4.35.0 (#954) ([83bc119a](https://github.com/electron-userland/electron-forge/commit/83bc119a))
  - bump @electron/get from 1.2.0 to 1.3.0 (#953) ([4b412251](https://github.com/electron-userland/electron-forge/commit/4b412251))
  - bump form-data from 2.3.3 to 2.4.0 (#952) ([f6678c82](https://github.com/electron-userland/electron-forge/commit/f6678c82))
  - bump find-up from 4.0.0 to 4.1.0 (#948) ([3783037f](https://github.com/electron-userland/electron-forge/commit/3783037f))
  - bump @octokit/rest from 16.28.1 to 16.28.2 (#946) ([693492fd](https://github.com/electron-userland/electron-forge/commit/693492fd))
  - bump username from 5.0.0 to 5.1.0 (#938) ([47801d90](https://github.com/electron-userland/electron-forge/commit/47801d90))
  - bump webpack from 4.33.0 to 4.34.0 (#940) ([168f4fd5](https://github.com/electron-userland/electron-forge/commit/168f4fd5))
  - bump @octokit/rest from 16.28.0 to 16.28.1 (#927) ([92d7ab56](https://github.com/electron-userland/electron-forge/commit/92d7ab56))
  - bump aws-sdk from 2.471.0 to 2.472.0 (#926) ([c500b188](https://github.com/electron-userland/electron-forge/commit/c500b188))
  - bump sudo-prompt from 8.2.5 to 9.0.0 (#908) ([9b504db6](https://github.com/electron-userland/electron-forge/commit/9b504db6))
  - bump webpack from 4.32.2 to 4.33.0 (#910) ([56b753da](https://github.com/electron-userland/electron-forge/commit/56b753da))
  - bump xterm from 3.14.1 to 3.14.2 (#907) ([6e62f0e5](https://github.com/electron-userland/electron-forge/commit/6e62f0e5))
  - bump @octokit/rest from 16.27.2 to 16.27.3 (#900) ([0c100e16](https://github.com/electron-userland/electron-forge/commit/0c100e16))
  - bump xterm from 3.13.2 to 3.14.0 (#898) ([ed8b2ab1](https://github.com/electron-userland/electron-forge/commit/ed8b2ab1))
  - bump @octokit/rest from 16.27.0 to 16.27.1 (#897) ([136d9fe8](https://github.com/electron-userland/electron-forge/commit/136d9fe8))
  - bump semver from 6.1.0 to 6.1.1 (#893) ([eb1e1bc3](https://github.com/electron-userland/electron-forge/commit/eb1e1bc3))
  - bump express from 4.17.0 to 4.17.1 (#887) ([18ceb8ac](https://github.com/electron-userland/electron-forge/commit/18ceb8ac))
  - [security] bump tar from 2.2.1 to 2.2.2 ([70f9ab29](https://github.com/electron-userland/electron-forge/commit/70f9ab29))
  - bump @octokit/rest from 16.26.0 to 16.27.0 (#879) ([fa4cf33f](https://github.com/electron-userland/electron-forge/commit/fa4cf33f))
  - bump xterm from 3.13.1 to 3.13.2 (#877) ([eca3dad3](https://github.com/electron-userland/electron-forge/commit/eca3dad3))

##### Chores

- fix problems with working dir check in bump version script ([677fa9b2](https://github.com/electron-userland/electron-forge/commit/677fa9b2))
- make sure the changelog modifications are with the proper git tag (#996) ([5a5b526f](https://github.com/electron-userland/electron-forge/commit/5a5b526f))
- upgrade declared babel packages to ^7.5.0 where available ([fd95c771](https://github.com/electron-userland/electron-forge/commit/fd95c771))
- upgrade babel packages to 7.5.0 ([ba5e42d1](https://github.com/electron-userland/electron-forge/commit/ba5e42d1))
- upgrade Electron Packager to 14.0.1 (#987) ([00bb5283](https://github.com/electron-userland/electron-forge/commit/00bb5283))
- upgrade dependencies ([3ad14a9d](https://github.com/electron-userland/electron-forge/commit/3ad14a9d))
- upgrade fs-extra to ^8.1.0 and @types/fs-extra to ^8.0.0 (#979) ([4be12b13](https://github.com/electron-userland/electron-forge/commit/4be12b13))
- upgrade @types/electron-packager to ^14.0.0 ([a4ddf816](https://github.com/electron-userland/electron-forge/commit/a4ddf816))
- upgrade typescript-eslint packages ([469c39c5](https://github.com/electron-userland/electron-forge/commit/469c39c5))
- upgrade to Electron Packager 14 & electron-installer-snap 4 (#958) ([8b497ca1](https://github.com/electron-userland/electron-forge/commit/8b497ca1))
- fix sudo-prompt type definition ([6f3c2ec3](https://github.com/electron-userland/electron-forge/commit/6f3c2ec3))
- replace pify with util.promisify ([b94692c4](https://github.com/electron-userland/electron-forge/commit/b94692c4))
- @babel/plugin-proposal-object-rest-spread isn't necessary as of Node 8 ([4e179c66](https://github.com/electron-userland/electron-forge/commit/4e179c66))
- upgrade dependencies for eslint ([24edb6ee](https://github.com/electron-userland/electron-forge/commit/24edb6ee))
- upgrade ts-node to 8.3.0 ([ee05021f](https://github.com/electron-userland/electron-forge/commit/ee05021f))
- upgrade dependencies for electron-rebuild ([e630efa0](https://github.com/electron-userland/electron-forge/commit/e630efa0))
- upgrade dependencies for electron-winstaller ([373e22f7](https://github.com/electron-userland/electron-forge/commit/373e22f7))
- upgrade dependencies for typedoc ([9a9486d1](https://github.com/electron-userland/electron-forge/commit/9a9486d1))
- upgrade dependencies for electron-installer-snap ([089ba6c6](https://github.com/electron-userland/electron-forge/commit/089ba6c6))
- upgrade dependencies for electron-installer-dmg ([a84ce5fb](https://github.com/electron-userland/electron-forge/commit/a84ce5fb))
- upgrade @malept/electron-installer-flatpak to ^0.10.0 (#944) ([8c8083bf](https://github.com/electron-userland/electron-forge/commit/8c8083bf))
- remove unnecessary direct node-gyp dependency (#943) ([e60a5cdf](https://github.com/electron-userland/electron-forge/commit/e60a5cdf))
- upgrade electron-installer-{debian,redhat} to ^2.0.0 (#928) ([8be98bf8](https://github.com/electron-userland/electron-forge/commit/8be98bf8))
- upgrade global to 4.4.0 ([7f4d5d0a](https://github.com/electron-userland/electron-forge/commit/7f4d5d0a))
- upgrade @typescript-eslint/{eslint-plugin,parser} to 1.10.2 ([ae434da5](https://github.com/electron-userland/electron-forge/commit/ae434da5))
- upgrade aws-sdk to 2.471.0 ([267c6d2e](https://github.com/electron-userland/electron-forge/commit/267c6d2e))
- upgrade @octokit/rest to 16.28.0 ([20733150](https://github.com/electron-userland/electron-forge/commit/20733150))
- upgrade electron-installer-dmg to ^3.0.0 (#914) ([6a048cb7](https://github.com/electron-userland/electron-forge/commit/6a048cb7))
- upgrade electron-rebuild to ^1.8.5 ([b0e019fd](https://github.com/electron-userland/electron-forge/commit/b0e019fd))
- update README for the create-electron-app command ([09fdf05d](https://github.com/electron-userland/electron-forge/commit/09fdf05d))
- **deps-dev:** bump babel-plugin-source-map-support ([5e32bcd9](https://github.com/electron-userland/electron-forge/commit/5e32bcd9))
- **deps:**
  - bump inquirer from 6.4.1 to 6.5.0 (#1012) ([aefd33cc](https://github.com/electron-userland/electron-forge/commit/aefd33cc))
  - bump xterm from 3.14.4 to 3.14.5 (#1011) ([edea6f9f](https://github.com/electron-userland/electron-forge/commit/edea6f9f))
- **core:**
  - fix typo ([2b59043a](https://github.com/electron-userland/electron-forge/commit/2b59043a))
  - re-enable built-in template tests (#876) ([23a0cab6](https://github.com/electron-userland/electron-forge/commit/23a0cab6))

##### Documentation Changes

- link to website repository ([9f1c84cc](https://github.com/electron-userland/electron-forge/commit/9f1c84cc))
- update links to website ([f3dd9301](https://github.com/electron-userland/electron-forge/commit/f3dd9301))
- fix plugins link (#923) ([38dafd65](https://github.com/electron-userland/electron-forge/commit/38dafd65))

##### New Features

- **template-webpack:** add file-loader/style-loader for handling the static CSS file ([054a458a](https://github.com/electron-userland/electron-forge/commit/054a458a))
- **core:** use git config to determine author before username (#920) ([57e30a47](https://github.com/electron-userland/electron-forge/commit/57e30a47))
- Various improvements for electron/template (#950) ([641f5218](https://github.com/electron-userland/electron-forge/commit/641f5218))

##### Bug Fixes

- **plugin-webpack:**
  - check that stats is not empty before sending to multi-logger (#1018) ([aa8587bf](https://github.com/electron-userland/electron-forge/commit/aa8587bf))
  - provide an output path so that hot reloading works correctly ([c8097c2f](https://github.com/electron-userland/electron-forge/commit/c8097c2f))
- **core:**
  - remove unnecessary character from HTML template ([6ab43314](https://github.com/electron-userland/electron-forge/commit/6ab43314))
  - update CI templates to Node 8 and other updates (#975) ([de3b4aac](https://github.com/electron-userland/electron-forge/commit/de3b4aac))
  - restart app in development via CLI multiple times (#904) ([df98fe81](https://github.com/electron-userland/electron-forge/commit/df98fe81))
- search for the top-level node_modules folder when using yarn workspaces (#902) ([a91d8b31](https://github.com/electron-userland/electron-forge/commit/a91d8b31))

##### Other Changes

- **deps:**
  - bump lodash.merge from 4.6.1 to 4.6.2 (#1006) ([21b40a48](https://github.com/electron-userland/electron-forge/commit/21b40a48))
  - bump lodash.template from 4.4.0 to 4.5.0 (#1003) ([3882dab6](https://github.com/electron-userland/electron-forge/commit/3882dab6))

##### Refactors

- **core:** move css in template to a separate file ([7c963aaf](https://github.com/electron-userland/electron-forge/commit/7c963aaf))
- convert from electron-download to @electron/get (#921) ([e5f74165](https://github.com/electron-userland/electron-forge/commit/e5f74165))

#### [6.0.0-beta.39](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.39) (2019-05-24)

##### Bug Fixes

- handle native modules in the main process correctly in the webpack plugin ([8d688b81](https://github.com/electron-userland/electron-forge/commit/8d688b81))

#### [6.0.0-beta.38](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.38) (2019-05-24)

##### Bug Fixes

- add missing @ symbol in webpack template ([84f61a7d](https://github.com/electron-userland/electron-forge/commit/84f61a7d))

#### [6.0.0-beta.37](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.37) (2019-05-24)

##### Bug Fixes

- use the forked version of the asset relocator ([05429a9c](https://github.com/electron-userland/electron-forge/commit/05429a9c))

#### [6.0.0-beta.36](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.36) (2019-05-24)

##### New Features

- support native modules in webpack template ([ed5fd371](https://github.com/electron-userland/electron-forge/commit/ed5fd371))

#### [6.0.0-beta.35](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.35) (2019-05-23)

##### Build System / Dependencies

- **deps:**
  - bump webpack from 4.32.1 to 4.32.2 (#873) ([1068f9c3](https://github.com/electron-userland/electron-forge/commit/1068f9c3))
  - bump semver from 6.0.0 to 6.1.0 (#870) ([2d2d6acc](https://github.com/electron-userland/electron-forge/commit/2d2d6acc))
  - bump webpack from 4.31.0 to 4.32.1 (#868) ([6f507e49](https://github.com/electron-userland/electron-forge/commit/6f507e49))
  - bump @octokit/rest from 16.25.6 to 16.26.0 (#864) ([d9109fa0](https://github.com/electron-userland/electron-forge/commit/d9109fa0))
  - bump @octokit/rest from 16.25.5 to 16.25.6 (#859) ([2de035ad](https://github.com/electron-userland/electron-forge/commit/2de035ad))
  - bump xterm from 3.13.0 to 3.13.1 (#861) ([81e672e9](https://github.com/electron-userland/electron-forge/commit/81e672e9))
  - bump express from 4.16.4 to 4.17.0 (#862) ([59d64fa7](https://github.com/electron-userland/electron-forge/commit/59d64fa7))
  - bump node-fetch from 2.5.0 to 2.6.0 (#860) ([30a66312](https://github.com/electron-userland/electron-forge/commit/30a66312))
  - bump @octokit/rest from 16.25.4 to 16.25.5 (#855) ([fa9124ad](https://github.com/electron-userland/electron-forge/commit/fa9124ad))
  - bump webpack-hot-middleware from 2.24.4 to 2.25.0 (#858) ([4293dd08](https://github.com/electron-userland/electron-forge/commit/4293dd08))
  - bump webpack-dev-middleware from 3.6.2 to 3.7.0 (#857) ([da19e020](https://github.com/electron-userland/electron-forge/commit/da19e020))
  - bump @octokit/rest from 16.25.3 to 16.25.4 (#846) ([a55cce0a](https://github.com/electron-userland/electron-forge/commit/a55cce0a))
  - bump webpack from 4.30.0 to 4.31.0 (#842) ([060fa838](https://github.com/electron-userland/electron-forge/commit/060fa838))
  - bump xterm from 3.12.2 to 3.13.0 (#843) ([bc50c923](https://github.com/electron-userland/electron-forge/commit/bc50c923))
  - bump glob from 7.1.3 to 7.1.4 (#841) ([c011610a](https://github.com/electron-userland/electron-forge/commit/c011610a))
  - bump @octokit/rest from 16.25.2 to 16.25.3 (#840) ([d240cc34](https://github.com/electron-userland/electron-forge/commit/d240cc34))
  - bump @octokit/rest from 16.25.1 to 16.25.2 (#838) ([d926b6df](https://github.com/electron-userland/electron-forge/commit/d926b6df))
  - bump electron-installer-redhat from 1.0.1 to 1.1.0 (#829) ([271196a0](https://github.com/electron-userland/electron-forge/commit/271196a0))
  - bump electron-installer-debian from 1.1.1 to 1.2.0 (#830) ([c6a32dd4](https://github.com/electron-userland/electron-forge/commit/c6a32dd4))
  - bump node-fetch from 2.4.1 to 2.5.0 (#824) ([ca1db36b](https://github.com/electron-userland/electron-forge/commit/ca1db36b))
  - bump @octokit/rest from 16.25.0 to 16.25.1 (#827) ([cf94150f](https://github.com/electron-userland/electron-forge/commit/cf94150f))
  - bump node-fetch from 2.3.0 to 2.4.1 (#815) ([864e0e91](https://github.com/electron-userland/electron-forge/commit/864e0e91))
  - bump webpack-hot-middleware from 2.24.3 to 2.24.4 (#810) ([c329e3fc](https://github.com/electron-userland/electron-forge/commit/c329e3fc))
  - bump node-gyp from 3.8.0 to 4.0.0 ([1740ebf8](https://github.com/electron-userland/electron-forge/commit/1740ebf8))
  - bump mime-types from 2.1.23 to 2.1.24 (#799) ([bd55bac5](https://github.com/electron-userland/electron-forge/commit/bd55bac5))
  - bump @octokit/rest from 16.24.3 to 16.25.0 (#793) ([0e973e93](https://github.com/electron-userland/electron-forge/commit/0e973e93))
  - bump mime-types from 2.1.22 to 2.1.23 (#787) ([668b7815](https://github.com/electron-userland/electron-forge/commit/668b7815))
  - bump @octokit/rest from 16.24.1 to 16.24.3 (#784) ([da9cf5d8](https://github.com/electron-userland/electron-forge/commit/da9cf5d8))
  - bump inquirer from 6.2.2 to 6.3.1 (#781) ([a84a24d4](https://github.com/electron-userland/electron-forge/commit/a84a24d4))
  - bump @octokit/rest from 16.23.4 to 16.24.1 (#782) ([431ede56](https://github.com/electron-userland/electron-forge/commit/431ede56))
  - bump webpack from 4.29.6 to 4.30.0 (#780) ([636a09c2](https://github.com/electron-userland/electron-forge/commit/636a09c2))
  - bump xterm from 3.12.0 to 3.12.2 (#777) ([8359a4f8](https://github.com/electron-userland/electron-forge/commit/8359a4f8))
  - bump @octokit/rest from 16.23.2 to 16.23.4 (#768) ([d86c17fa](https://github.com/electron-userland/electron-forge/commit/d86c17fa))
  - bump source-map-support from 0.5.11 to 0.5.12 (#766) ([b0a7fa16](https://github.com/electron-userland/electron-forge/commit/b0a7fa16))
- **deps-dev:**
  - bump @babel/preset-env from 7.4.4 to 7.4.5 ([2d82c356](https://github.com/electron-userland/electron-forge/commit/2d82c356))
  - bump @types/inquirer from 6.0.2 to 6.0.3 ([7497fa6d](https://github.com/electron-userland/electron-forge/commit/7497fa6d))
  - bump @types/node-fetch from 2.3.3 to 2.3.4 ([b3a8658f](https://github.com/electron-userland/electron-forge/commit/b3a8658f))
  - bump @types/fetch-mock from 7.2.5 to 7.3.0 ([d9f91767](https://github.com/electron-userland/electron-forge/commit/d9f91767))
  - bump @types/fetch-mock from 7.2.3 to 7.2.5 ([295939b3](https://github.com/electron-userland/electron-forge/commit/295939b3))
  - bump @types/node from 12.0.1 to 12.0.2 ([ab224d41](https://github.com/electron-userland/electron-forge/commit/ab224d41))
  - bump @types/inquirer from 6.0.1 to 6.0.2 ([647e3d40](https://github.com/electron-userland/electron-forge/commit/647e3d40))
  - bump @types/node from 12.0.0 to 12.0.1 ([53fac4f4](https://github.com/electron-userland/electron-forge/commit/53fac4f4))
  - bump cz-customizable from 6.0.0 to 6.2.0 ([ababd4f8](https://github.com/electron-userland/electron-forge/commit/ababd4f8))
  - bump @types/fs-extra from 5.1.0 to 7.0.0 ([7111fa9d](https://github.com/electron-userland/electron-forge/commit/7111fa9d))
  - bump @typescript-eslint/eslint-plugin ([3d68a19a](https://github.com/electron-userland/electron-forge/commit/3d68a19a))
  - bump @typescript-eslint/parser from 1.7.0 to 1.9.0 ([638a2878](https://github.com/electron-userland/electron-forge/commit/638a2878))
  - bump nyc from 14.1.0 to 14.1.1 ([954b0e9b](https://github.com/electron-userland/electron-forge/commit/954b0e9b))
  - bump @types/fs-extra from 5.0.5 to 5.1.0 ([e92eba12](https://github.com/electron-userland/electron-forge/commit/e92eba12))
  - bump @types/node from 11.13.9 to 12.0.0 ([bfe59186](https://github.com/electron-userland/electron-forge/commit/bfe59186))
  - bump eslint-plugin-react from 7.12.4 to 7.13.0 ([7a0a2e14](https://github.com/electron-userland/electron-forge/commit/7a0a2e14))
  - bump @types/webpack from 4.4.29 to 4.4.31 ([2ecad192](https://github.com/electron-userland/electron-forge/commit/2ecad192))
  - bump nyc from 14.0.0 to 14.1.0 ([14bead37](https://github.com/electron-userland/electron-forge/commit/14bead37))
  - bump @types/node from 11.13.8 to 11.13.9 ([99c106fd](https://github.com/electron-userland/electron-forge/commit/99c106fd))
  - bump nodemon from 1.18.11 to 1.19.0 ([8ef391cd](https://github.com/electron-userland/electron-forge/commit/8ef391cd))
  - bump @types/listr from 0.13.0 to 0.14.0 ([aad14f32](https://github.com/electron-userland/electron-forge/commit/aad14f32))
  - bump @babel/plugin-proposal-object-rest-spread ([bdb74be6](https://github.com/electron-userland/electron-forge/commit/bdb74be6))
  - bump @babel/preset-env from 7.4.3 to 7.4.4 ([443e811f](https://github.com/electron-userland/electron-forge/commit/443e811f))
  - bump @babel/plugin-proposal-class-properties ([89cb5262](https://github.com/electron-userland/electron-forge/commit/89cb5262))
  - bump @babel/cli from 7.4.3 to 7.4.4 ([39a0fa54](https://github.com/electron-userland/electron-forge/commit/39a0fa54))
  - bump @babel/register from 7.4.0 to 7.4.4 ([5a9e9a64](https://github.com/electron-userland/electron-forge/commit/5a9e9a64))
  - bump @babel/core from 7.4.3 to 7.4.4 ([1215123d](https://github.com/electron-userland/electron-forge/commit/1215123d))
  - bump @types/node from 11.13.7 to 11.13.8 ([6bfd73aa](https://github.com/electron-userland/electron-forge/commit/6bfd73aa))
  - bump @types/webpack from 4.4.27 to 4.4.29 ([365d7d31](https://github.com/electron-userland/electron-forge/commit/365d7d31))
  - bump @types/node-fetch from 2.3.2 to 2.3.3 ([9f16b35c](https://github.com/electron-userland/electron-forge/commit/9f16b35c))
  - bump @types/inquirer from 6.0.0 to 6.0.1 ([aa86b7e5](https://github.com/electron-userland/electron-forge/commit/aa86b7e5))
  - bump typescript from 3.4.4 to 3.4.5 ([55e5254f](https://github.com/electron-userland/electron-forge/commit/55e5254f))
  - bump @types/node from 11.13.6 to 11.13.7 ([267a1084](https://github.com/electron-userland/electron-forge/commit/267a1084))
  - bump fetch-mock from 7.3.1 to 7.3.3 (#802) ([9c0bee40](https://github.com/electron-userland/electron-forge/commit/9c0bee40))
  - bump @typescript-eslint/eslint-plugin ([7bcf01ac](https://github.com/electron-userland/electron-forge/commit/7bcf01ac))
  - bump commitizen from 3.1.0 to 3.1.1 ([8124d23b](https://github.com/electron-userland/electron-forge/commit/8124d23b))
  - bump @typescript-eslint/parser from 1.6.0 to 1.7.0 ([8f2b8e66](https://github.com/electron-userland/electron-forge/commit/8f2b8e66))
  - bump @types/webpack-merge from 4.1.4 to 4.1.5 ([2ccec31f](https://github.com/electron-userland/electron-forge/commit/2ccec31f))
  - bump @types/node from 11.13.5 to 11.13.6 ([4e558811](https://github.com/electron-userland/electron-forge/commit/4e558811))
  - bump mocha from 6.1.3 to 6.1.4 (#794) ([e82adb77](https://github.com/electron-userland/electron-forge/commit/e82adb77))
  - bump commitizen from 3.0.7 to 3.1.0 ([6d36076e](https://github.com/electron-userland/electron-forge/commit/6d36076e))
  - bump typescript from 3.4.3 to 3.4.4 ([7cd818ac](https://github.com/electron-userland/electron-forge/commit/7cd818ac))
  - bump sinon from 7.3.1 to 7.3.2 (#789) ([4b3d5678](https://github.com/electron-userland/electron-forge/commit/4b3d5678))
  - bump @types/node from 11.13.4 to 11.13.5 ([d6e18dc4](https://github.com/electron-userland/electron-forge/commit/d6e18dc4))
  - bump eslint-plugin-import from 2.17.1 to 2.17.2 ([8c833b6c](https://github.com/electron-userland/electron-forge/commit/8c833b6c))
  - bump nyc from 13.3.0 to 14.0.0 ([17f5e707](https://github.com/electron-userland/electron-forge/commit/17f5e707))
  - bump @types/webpack-merge from 4.1.3 to 4.1.4 ([fa1d6a73](https://github.com/electron-userland/electron-forge/commit/fa1d6a73))
  - bump cz-customizable from 5.10.0 to 6.0.0 ([e9d60b3c](https://github.com/electron-userland/electron-forge/commit/e9d60b3c))
  - bump eslint-plugin-import from 2.16.0 to 2.17.1 ([fa35f96a](https://github.com/electron-userland/electron-forge/commit/fa35f96a))
  - bump ts-node from 8.0.3 to 8.1.0 ([4198a0ea](https://github.com/electron-userland/electron-forge/commit/4198a0ea))
  - bump mocha from 6.1.2 to 6.1.3 (#773) ([5f798fe9](https://github.com/electron-userland/electron-forge/commit/5f798fe9))
  - bump @types/node-fetch from 2.3.1 to 2.3.2 ([dd53d4bd](https://github.com/electron-userland/electron-forge/commit/dd53d4bd))
  - bump @types/debug from 4.1.3 to 4.1.4 ([dd17e103](https://github.com/electron-userland/electron-forge/commit/dd17e103))
  - bump @types/node-fetch from 2.3.0 to 2.3.1 ([c40b527b](https://github.com/electron-userland/electron-forge/commit/c40b527b))
  - bump @types/node from 11.13.2 to 11.13.4 ([8051ea23](https://github.com/electron-userland/electron-forge/commit/8051ea23))
  - bump mocha from 6.1.1 to 6.1.2 (#763) ([edfbdb8d](https://github.com/electron-userland/electron-forge/commit/edfbdb8d))
  - bump typescript from 3.4.2 to 3.4.3 ([def0531b](https://github.com/electron-userland/electron-forge/commit/def0531b))
  - bump nodemon from 1.18.10 to 1.18.11 ([b81c66c1](https://github.com/electron-userland/electron-forge/commit/b81c66c1))
  - bump @types/node from 11.13.0 to 11.13.2 ([23194f9c](https://github.com/electron-userland/electron-forge/commit/23194f9c))
  - bump mocha from 6.0.2 to 6.1.1 ([8e6b3cac](https://github.com/electron-userland/electron-forge/commit/8e6b3cac))
  - bump typescript from 3.4.1 to 3.4.2 ([6818ca99](https://github.com/electron-userland/electron-forge/commit/6818ca99))
  - bump cz-customizable from 5.9.0 to 5.10.0 ([19a4e2ae](https://github.com/electron-userland/electron-forge/commit/19a4e2ae))
  - bump @types/node-fetch from 2.1.7 to 2.3.0 ([1bf14cb0](https://github.com/electron-userland/electron-forge/commit/1bf14cb0))
  - bump cz-customizable from 5.7.0 to 5.9.0 ([82e9c4d9](https://github.com/electron-userland/electron-forge/commit/82e9c4d9))
  - bump @types/node-fetch from 2.1.6 to 2.1.7 ([ac2b31e8](https://github.com/electron-userland/electron-forge/commit/ac2b31e8))
  - bump @types/semver from 5.5.0 to 6.0.0 ([8b583a6e](https://github.com/electron-userland/electron-forge/commit/8b583a6e))
  - bump @types/webpack from 4.4.26 to 4.4.27 ([9fa42eef](https://github.com/electron-userland/electron-forge/commit/9fa42eef))
  - bump @typescript-eslint/eslint-plugin ([9083bfbc](https://github.com/electron-userland/electron-forge/commit/9083bfbc))
  - bump @types/sinon from 7.0.10 to 7.0.11 ([d3de8c94](https://github.com/electron-userland/electron-forge/commit/d3de8c94))
  - bump eslint from 5.15.3 to 5.16.0 ([41fab31b](https://github.com/electron-userland/electron-forge/commit/41fab31b))
  - bump @babel/cli from 7.2.3 to 7.4.3 ([06b74a41](https://github.com/electron-userland/electron-forge/commit/06b74a41))
  - bump @babel/register from 7.0.0 to 7.4.0 ([83b30d86](https://github.com/electron-userland/electron-forge/commit/83b30d86))
  - bump @babel/plugin-proposal-object-rest-spread (#737) ([9713a039](https://github.com/electron-userland/electron-forge/commit/9713a039))
  - bump @types/inquirer from 0.0.44 to 6.0.0 (#732) ([e18750ee](https://github.com/electron-userland/electron-forge/commit/e18750ee))
  - bump @babel/core from 7.3.4 to 7.4.3 (#735) ([9dd656e0](https://github.com/electron-userland/electron-forge/commit/9dd656e0))
  - bump @babel/preset-env from 7.3.4 to 7.4.3 (#729) ([b76b810f](https://github.com/electron-userland/electron-forge/commit/b76b810f))
  - bump @types/debug from 4.1.2 to 4.1.3 (#730) ([11272269](https://github.com/electron-userland/electron-forge/commit/11272269))
  - bump @types/node from 11.11.3 to 11.13.0 (#726) ([8464ca4f](https://github.com/electron-userland/electron-forge/commit/8464ca4f))
  - bump typescript from 3.3.3333 to 3.4.1 (#728) ([dbfdae96](https://github.com/electron-userland/electron-forge/commit/dbfdae96))
  - bump @babel/plugin-proposal-class-properties (#727) ([c9a15f35](https://github.com/electron-userland/electron-forge/commit/c9a15f35))
- do not attempt to publish docs on forks ([4b3ca888](https://github.com/electron-userland/electron-forge/commit/4b3ca888))
- fix non-beta tagging in the npm publish script ([8e062e6f](https://github.com/electron-userland/electron-forge/commit/8e062e6f))

##### Chores

- improve first-run experience ([49bf7a15](https://github.com/electron-userland/electron-forge/commit/49bf7a15))
- remove templates which don't work with Forge 6 (#874) ([ef27272a](https://github.com/electron-userland/electron-forge/commit/ef27272a))
- upgrade electron-installer-snap to ^3.2.0 for Electron 5 sandbox support ([1cadd68e](https://github.com/electron-userland/electron-forge/commit/1cadd68e))
- upgrade electron-rebuild deps, including node-abi ([b28e51d0](https://github.com/electron-userland/electron-forge/commit/b28e51d0))
- upgrade semver to ^6 ([cf002ee9](https://github.com/electron-userland/electron-forge/commit/cf002ee9))
- upgrade dependencies ([3a94ad60](https://github.com/electron-userland/electron-forge/commit/3a94ad60))
- drop tslint (#731) ([f530aead](https://github.com/electron-userland/electron-forge/commit/f530aead))
- replace tslint with eslint to lint mocha tests (#590) ([7af36d59](https://github.com/electron-userland/electron-forge/commit/7af36d59))
- **web-multi-logger:** fix package description (#806) ([567e8e58](https://github.com/electron-userland/electron-forge/commit/567e8e58))

##### Documentation Changes

- Fix 'Docs and Usage' link (#723) ([7abca7d3](https://github.com/electron-userland/electron-forge/commit/7abca7d3))
- ensure that the CLI package has a README on NPM ([00b87a0e](https://github.com/electron-userland/electron-forge/commit/00b87a0e))

##### New Features

- add a barebones webpack template ([3b935c8f](https://github.com/electron-userland/electron-forge/commit/3b935c8f))
- Node 8 support (#875) ([db89c4ef](https://github.com/electron-userland/electron-forge/commit/db89c4ef))
- **plugin-webpack:** allow port to be configurable for web-multi-logger ([330d0f59](https://github.com/electron-userland/electron-forge/commit/330d0f59))

##### Bug Fixes

- make the version lookup more resilient to install strategy ([068c2f81](https://github.com/electron-userland/electron-forge/commit/068c2f81))
- **plugin-webpack:**
  - change all LoggerPort to camel case ([198ab61c](https://github.com/electron-userland/electron-forge/commit/198ab61c))
  - fix output string color ([0c8b7e96](https://github.com/electron-userland/electron-forge/commit/0c8b7e96))

#### [6.0.0-beta.34](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.34) (2019-03-21)

##### Chores

- temporarily release stable tags for V6 beta ([be1cf7b0](https://github.com/electron-userland/electron-forge/commit/be1cf7b0))
- switch flatpak maker to @malept/electron-installer-flatpak (#714) ([02ddd848](https://github.com/electron-userland/electron-forge/commit/02ddd848))
- upgrade electron-winstaller to ^3.0.4 ([d3e7305c](https://github.com/electron-userland/electron-forge/commit/d3e7305c))
- fix ps1 issue on windows CI ([5c13df3b](https://github.com/electron-userland/electron-forge/commit/5c13df3b))
- upgrade dependencies (#701) ([83bfe971](https://github.com/electron-userland/electron-forge/commit/83bfe971))

##### Bug Fixes

- **plugin-webpack:**
  - allow port to be configurable (#693) ([4da0230f](https://github.com/electron-userland/electron-forge/commit/4da0230f))
  - throw an error if webpack generates compilation errors when packaging (#695) ([696b11d9](https://github.com/electron-userland/electron-forge/commit/696b11d9))
- **core:** be more descriptive when a plugin/maker/publisher module isn't found ([788412e3](https://github.com/electron-userland/electron-forge/commit/788412e3))

#### [6.0.0-beta.33](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.33) (2019-02-08)

##### Chores

- **core:** upgrade electron-rebuild to 1.8.3 ([45d454a4](https://github.com/electron-userland/electron-forge/commit/45d454a4))
- upgrade typescript to 3.2.2 (#649) ([7abaf7f7](https://github.com/electron-userland/electron-forge/commit/7abaf7f7))

##### New Features

- **core:** add basic support for non-exact Electron versions ([177012e9](https://github.com/electron-userland/electron-forge/commit/177012e9))

##### Bug Fixes

- use git to check that you're in a Git repository (#689) ([72b8eea4](https://github.com/electron-userland/electron-forge/commit/72b8eea4))
- abstract base classes should implement shared type interfaces (#684) ([d15a8cc2](https://github.com/electron-userland/electron-forge/commit/d15a8cc2))
- **plugin-webpack:** make the PRELOAD_ENTRY variable map to undefined when there is no preload ([2e71061a](https://github.com/electron-userland/electron-forge/commit/2e71061a))

##### Other Changes

- use NPM cache ([1e3cb109](https://github.com/electron-userland/electron-forge/commit/1e3cb109))

#### [6.0.0-beta.32](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.32) (2019-01-15)

##### Bug Fixes

- **core:** add lodash.merge to package.json ([803bb362](https://github.com/electron-userland/electron-forge/commit/803bb362))

#### [6.0.0-beta.31](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.31) (2019-01-15)

##### Chores

- **maker:** update debian/redhat/snap installer dependencies ([2c22f1be](https://github.com/electron-userland/electron-forge/commit/2c22f1be))
- run now with Node 8 in a separate Travis CI stage ([f93da7a5](https://github.com/electron-userland/electron-forge/commit/f93da7a5))
- update dependencies ([3b5b8044](https://github.com/electron-userland/electron-forge/commit/3b5b8044))
- use cross-env for windows support in test helper ([91c35869](https://github.com/electron-userland/electron-forge/commit/91c35869))
- fix linting issue in tools ([ec34411a](https://github.com/electron-userland/electron-forge/commit/ec34411a))
- update all package.json refs to match top level package.json ([07fc2aa4](https://github.com/electron-userland/electron-forge/commit/07fc2aa4))
- update all deps for v6 ([d0bdf611](https://github.com/electron-userland/electron-forge/commit/d0bdf611))
- **core:** upgrade to Electron Packager 13 ([ba612bc4](https://github.com/electron-userland/electron-forge/commit/ba612bc4))

##### Documentation Changes

- add docs on using the new testing helpers ([06c4602b](https://github.com/electron-userland/electron-forge/commit/06c4602b))

##### New Features

- **core:**
  - add support for electron-nightly ([a74169ee](https://github.com/electron-userland/electron-forge/commit/a74169ee))
  - add basic Forge v5 to v6 importer ([648ef333](https://github.com/electron-userland/electron-forge/commit/648ef333))

##### Bug Fixes

- **plugin-webpack:** fix incorrect PRELOAD_WEBPACK_ENTRY. (#635) ([6eae1b5c](https://github.com/electron-userland/electron-forge/commit/6eae1b5c))

##### Refactors

- make running tests better with --fast and --match utils ([fb776e19](https://github.com/electron-userland/electron-forge/commit/fb776e19))
- **plugin-auto-unpack-natives:** clean up plugin impl ([a05e2dc0](https://github.com/electron-userland/electron-forge/commit/a05e2dc0))

##### Tests

- **core:**
  - add tests for updateElectronDependency and getElectronVersion ([cc93be9e](https://github.com/electron-userland/electron-forge/commit/cc93be9e))
  - fix fixture resolution for core tests ([7a0dfe9b](https://github.com/electron-userland/electron-forge/commit/7a0dfe9b))
- **publisher-base:** add \_\_is test for base publisher ([503f3025](https://github.com/electron-userland/electron-forge/commit/503f3025))

#### [6.0.0-beta.30](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.30) (2018-11-20)

##### Chores

- add yarn integrity SHA's to lock file ([e1ea4c3e](https://github.com/electron-userland/electron-forge/commit/e1ea4c3e))
- make type checking faster, type check entire repo at once ([00c5769f](https://github.com/electron-userland/electron-forge/commit/00c5769f))
- make templates work in v6 ([22549d92](https://github.com/electron-userland/electron-forge/commit/22549d92))
- update dependencies ([cddfb1f5](https://github.com/electron-userland/electron-forge/commit/cddfb1f5))
- remove .npmignore from git ([61884d33](https://github.com/electron-userland/electron-forge/commit/61884d33))
- **cli:** chmod +x src/electron-forge.js so the compiled file is also executable ([ca60a3fd](https://github.com/electron-userland/electron-forge/commit/ca60a3fd))

##### Documentation Changes

- fix CONTRIBUTING.md link in README ([01e715fd](https://github.com/electron-userland/electron-forge/commit/01e715fd))
- add contributing docs ([80259589](https://github.com/electron-userland/electron-forge/commit/80259589))

##### Bug Fixes

- **maker-dmg:** return correct path from dmg maker (#631) ([b6c523c9](https://github.com/electron-userland/electron-forge/commit/b6c523c9))
- **maker-wix:** correct path to distributable ([5eee34f4](https://github.com/electron-userland/electron-forge/commit/5eee34f4))
- **core:**
  - rename maker fixtures so they will get compiled by babel/typescript (#630) ([dabd5956](https://github.com/electron-userland/electron-forge/commit/dabd5956))
  - show the package manager stderr when installing deps fails ([2dfde761](https://github.com/electron-userland/electron-forge/commit/2dfde761))
- fix build failing due to ts-node bug ([19f0c03f](https://github.com/electron-userland/electron-forge/commit/19f0c03f))
- clean up the .webpack folder before builds. Fixes #596 ([c64b11ce](https://github.com/electron-userland/electron-forge/commit/c64b11ce))

##### Tests

- **core:** assert that makers' output files are in the correct directory ([50a4f06f](https://github.com/electron-userland/electron-forge/commit/50a4f06f))

#### [6.0.0-beta.29](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.29) (2018-10-16)

##### Chores

- add .npmignore when publishing ([380762e9](https://github.com/electron-userland/electron-forge/commit/380762e9))

##### New Features

- auto-ignore everything that is not webpack output during the webpack build. Fixes #593 ([51a22f74](https://github.com/electron-userland/electron-forge/commit/51a22f74))
- **publisher-bitbucket:** initial publish publisher-bitbucket (#571) ([82e8c85e](https://github.com/electron-userland/electron-forge/commit/82e8c85e))

##### Bug Fixes

- **maker-deb:** return the correct outPath with a prerelease version (#584) ([a4fbc0a7](https://github.com/electron-userland/electron-forge/commit/a4fbc0a7))

#### [6.0.0-beta.28](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.28) (2018-09-10)

##### Chores

- use yarn to run commands on CI to make output better ([12209b00](https://github.com/electron-userland/electron-forge/commit/12209b00))
- upgrade tslint-config-airbnb ([3618e991](https://github.com/electron-userland/electron-forge/commit/3618e991))
- **core:** upgrade @types/electron-packager ([2bab74c7](https://github.com/electron-userland/electron-forge/commit/2bab74c7))

##### New Features

- **core:** resolve forge.config.js by default if it exists (#569) ([5431dfa1](https://github.com/electron-userland/electron-forge/commit/5431dfa1))

##### Bug Fixes

- bumps bolt version in Travis (was already bumped in docker and appveyor (#570) ([640ba77b](https://github.com/electron-userland/electron-forge/commit/640ba77b))
- **core:**
  - keep track of application restarts and close stdin pipe correctly (#567) ([eb29dd6d](https://github.com/electron-userland/electron-forge/commit/eb29dd6d))
  - resolve publisher config correctly when given a publisher name (#568) ([f37476bf](https://github.com/electron-userland/electron-forge/commit/f37476bf))
  - stops breaking regexps in the config parser ([8f1d4105](https://github.com/electron-userland/electron-forge/commit/8f1d4105))

#### [6.0.0-beta.27](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.27) (2018-08-06)

##### Chores

- add OTP support to the publish script ([a5bec3a8](https://github.com/electron-userland/electron-forge/commit/a5bec3a8))

##### New Features

- **core:** allow no config to be present, default to an empty object (#543) ([c71ef163](https://github.com/electron-userland/electron-forge/commit/c71ef163))

##### Bug Fixes

- **web-multi-logger:** fix path to xterm static files ([803a22fc](https://github.com/electron-userland/electron-forge/commit/803a22fc))

#### [6.0.0-beta.26](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.26) (2018-07-20)

##### Chores

- **core:** fix TS build ([b9ea8bd4](https://github.com/electron-userland/electron-forge/commit/b9ea8bd4))
- **maker-snap:** upgrade electron-installer-snap to ^3.0.0 ([e55a9d5b](https://github.com/electron-userland/electron-forge/commit/e55a9d5b))
- ensure failures on CI actually fail CI ([91ede6fa](https://github.com/electron-userland/electron-forge/commit/91ede6fa))

##### Bug Fixes

- **core:**
  - append current version to each sibling dependency of `@electron-forge` in the boilerplate (#537) ([051026da](https://github.com/electron-userland/electron-forge/commit/051026da))
  - wait for overrideStartLogic before attempting to resolve the location of the Electron mod ([7e74206d](https://github.com/electron-userland/electron-forge/commit/7e74206d))

##### Code Style Changes

- **core:** remove unnecessary semicolon from class definition in make.ts (#530) ([8ccff56d](https://github.com/electron-userland/electron-forge/commit/8ccff56d))

#### [6.0.0-beta.25](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.25) (2018-07-12)

##### Chores

- **core:** add \*.ts to .editorconfig (#527) ([ae0bf4a0](https://github.com/electron-userland/electron-forge/commit/ae0bf4a0))

##### New Features

- **maker-dmg:** update electron-installer-dmg for new features ([766259fa](https://github.com/electron-userland/electron-forge/commit/766259fa))

#### [6.0.0-beta.24](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.24) (2018-07-06)

##### Build System / Dependencies

- fixup publish script ([21aceca2](https://github.com/electron-userland/electron-forge/commit/21aceca2))

##### Chores

- fix linting for else if return syntax ([ad061fb1](https://github.com/electron-userland/electron-forge/commit/ad061fb1))

##### Bug Fixes

- **plugin-compile:**
  - bind in constructor to make TS happy ([5cb74d4c](https://github.com/electron-userland/electron-forge/commit/5cb74d4c))
  - use correctly bound methods in CompilePlugin ([df2acc73](https://github.com/electron-userland/electron-forge/commit/df2acc73))
- **cli:** use scoped package path in vscode debugger scripts (#524) ([f1b90b67](https://github.com/electron-userland/electron-forge/commit/f1b90b67))

#### [6.0.0-beta.23](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.23) (2018-07-05)

##### Chores

- fix sync-readmes running on node 6 ([19613388](https://github.com/electron-userland/electron-forge/commit/19613388))
- set up auto deploy of the JS API site ([4466904b](https://github.com/electron-userland/electron-forge/commit/4466904b))

##### Continuous Integration

- use NOW_TOKEN on travis to deploy ([bdaf564e](https://github.com/electron-userland/electron-forge/commit/bdaf564e))
- install now globally for ci ([6b29c325](https://github.com/electron-userland/electron-forge/commit/6b29c325))

##### Bug Fixes

- **core:** makers, publishers and plugins should be resolved relative to current dir not install dir ([74e6ac8d](https://github.com/electron-userland/electron-forge/commit/74e6ac8d))

#### [6.0.0-beta.22](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.22) (2018-07-04)

##### New Features

- **plugin-compile:** add the electron compile plugin into the monorepo ([5907de5d](https://github.com/electron-userland/electron-forge/commit/5907de5d))

##### Bug Fixes

- **plugin-local-electron:** new config setup means that a configfetcher is passed to the plugin not ([37a1e071](https://github.com/electron-userland/electron-forge/commit/37a1e071))

#### [6.0.0-beta.21](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.21) (2018-07-03)

##### Performance Improvements

- **publisher-nucleus:** merge make results when arch/platform/version are all the same to speed up ([fbc4db42](https://github.com/electron-userland/electron-forge/commit/fbc4db42))

#### [6.0.0-beta.20](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.20) (2018-06-27)

##### Refactors

- update publish tooling to be nicer to people publishing forge itself ([4137bda4](https://github.com/electron-userland/electron-forge/commit/4137bda4))

#### [6.0.0-beta.19](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.19) (2018-06-27)

##### Chores

- remove unused gitignore files ([816d59e3](https://github.com/electron-userland/electron-forge/commit/816d59e3))

##### New Features

- **cli:** dont check system if the marker file is created ([ce5a4a2e](https://github.com/electron-userland/electron-forge/commit/ce5a4a2e))

##### Bug Fixes

- add prepareConfig calls to tests ([085c75d3](https://github.com/electron-userland/electron-forge/commit/085c75d3))
- **core:** do platform filtering later in the make chain to ensure that default platforms are respec ([19e0543e](https://github.com/electron-userland/electron-forge/commit/19e0543e))

##### Performance Improvements

- measure performance of async oras when in debug mode ([3b625ded](https://github.com/electron-userland/electron-forge/commit/3b625ded))

#### [6.0.0-beta.18](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.18) (2018-06-18)

##### Bug Fixes

- **core:** re-implement the config fetcher syntax from forge, undocumented so we can remove at any t ([ebac71c1](https://github.com/electron-userland/electron-forge/commit/ebac71c1))

#### [6.0.0-beta.17](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.17) (2018-06-04)

##### New Features

- **core:** allow mutating packageJSON on load ([1b7e4117](https://github.com/electron-userland/electron-forge/commit/1b7e4117))

##### Bug Fixes

- **core:**
  - allow multiple plugins, fix bad startLogic check ([9164ec51](https://github.com/electron-userland/electron-forge/commit/9164ec51))
  - disable the packagerConfig.all option (#510) ([ce363562](https://github.com/electron-userland/electron-forge/commit/ce363562))

#### [6.0.0-beta.16](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.16) (2018-05-17)

##### Chores

- **plugin-local-electron:** remove duplicate dep ([d0eacbcc](https://github.com/electron-userland/electron-forge/commit/d0eacbcc))
- **web-multi-logger:** set some methods as private for docs ([0d737ae7](https://github.com/electron-userland/electron-forge/commit/0d737ae7))

##### Documentation Changes

- **web-multi-logger:**
  - add doc comments for js API site ([a79931f8](https://github.com/electron-userland/electron-forge/commit/a79931f8))
  - basic usage and README ([70801f63](https://github.com/electron-userland/electron-forge/commit/70801f63))

##### New Features

- **plugin-auto-unpack-natives:** add plugin/auto-unpack-natives for automative native node module h ([0280d0fa](https://github.com/electron-userland/electron-forge/commit/0280d0fa))
- **core:** add resolveForgeConfig hook ([c2f4cfa6](https://github.com/electron-userland/electron-forge/commit/c2f4cfa6))
- **plugin-webpack:** support web workers by defining entry points without HTML files ([a85ce4eb](https://github.com/electron-userland/electron-forge/commit/a85ce4eb))

##### Bug Fixes

- **core:**
  - make packagerConfig and rebuildConfig partial (all things optional) ([d499d650](https://github.com/electron-userland/electron-forge/commit/d499d650))
  - remove default values from template package.json makers ([7d1bdf2b](https://github.com/electron-userland/electron-forge/commit/7d1bdf2b))
  - init with required makers as well ([04ead91c](https://github.com/electron-userland/electron-forge/commit/04ead91c))

#### [6.0.0-beta.15](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.15) (2018-05-15)

##### Bug Fixes

- **plugin-webpack:** ensure production mode is only enabled when packaging ([dcb2b9ba](https://github.com/electron-userland/electron-forge/commit/dcb2b9ba))

#### [6.0.0-beta.14](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.14) (2018-05-14)

##### New Features

- **plugin-webpack:** upgrade to webpack 4 ([8807c451](https://github.com/electron-userland/electron-forge/commit/8807c451))

##### Bug Fixes

- **core:**
  - stop specs hanging due to pending process.stdin listener ([b747c99b](https://github.com/electron-userland/electron-forge/commit/b747c99b))
  - fix start specs ([987161e5](https://github.com/electron-userland/electron-forge/commit/987161e5))
- **maker-zip:** adjust cross-zip require ([bd35ecd0](https://github.com/electron-userland/electron-forge/commit/bd35ecd0))
- remove .only from specs ([86ea1942](https://github.com/electron-userland/electron-forge/commit/86ea1942))

##### Refactors

- **plugin-webpack:** use a single webpack compiler for all renderer process's ([674c5f22](https://github.com/electron-userland/electron-forge/commit/674c5f22))

#### [6.0.0-beta.13](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.13) (2018-05-07)

##### Bug Fixes

- **web-multi-logger:** fix xterm path resolution ([39509d9c](https://github.com/electron-userland/electron-forge/commit/39509d9c))

##### Code Style Changes

- **plugin-webpack:** add missing semi ([cbe2c182](https://github.com/electron-userland/electron-forge/commit/cbe2c182))

#### [6.0.0-beta.12](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.12) (2018-05-07)

##### New Features

- **core:** add support for restarting the Electron process quickly from terminal ([24aab4fd](https://github.com/electron-userland/electron-forge/commit/24aab4fd))

#### [6.0.0-beta.11](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.11) (2018-05-07)

##### New Features

- **plugin-webpack:**
  - log out the web logger URL on start ([cdd4cde1](https://github.com/electron-userland/electron-forge/commit/cdd4cde1))
  - capture logs into web ui, handle preload scripts ([e800049b](https://github.com/electron-userland/electron-forge/commit/e800049b))

##### Bug Fixes

- **publisher-github:** remove deprecated option from @octokit/rest params (#505) ([8ffab0b4](https://github.com/electron-userland/electron-forge/commit/8ffab0b4))
- **plugin-webpack:** fix config resolution when providing a string ([576844e5](https://github.com/electron-userland/electron-forge/commit/576844e5))

#### [6.0.0-beta.10](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.10) (2018-05-04)

##### Bug Fixes

- **plugin-webpack:** ensure methods are bound to class instance ([0ee2dbb5](https://github.com/electron-userland/electron-forge/commit/0ee2dbb5))

#### [6.0.0-beta.9](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.9) (2018-05-04)

##### New Features

- **plugin-webpack:** new webpack plugin ([531d3c80](https://github.com/electron-userland/electron-forge/commit/531d3c80))

#### [6.0.0-beta.8](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.8) (2018-05-03)

##### Chores

- fix readme generation for info blocks ([7609a87c](https://github.com/electron-userland/electron-forge/commit/7609a87c))

#### [6.0.0-beta.7](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.7) (2018-05-03)

##### Chores

- set up README sync so that docs on the site are published to js.electronforge.io and to npm w ([513013e6](https://github.com/electron-userland/electron-forge/commit/513013e6))

##### Bug Fixes

- remove unneeded 2 second timeout ([ab64142f](https://github.com/electron-userland/electron-forge/commit/ab64142f))

#### [6.0.0-beta.6](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.6) (2018-05-03)

##### Chores

- **maker-zip:** update yarn.lock ([9714be38](https://github.com/electron-userland/electron-forge/commit/9714be38))

##### Documentation Changes

- **plugin-local-electron:** add docs for the config options ([ebcd4c13](https://github.com/electron-userland/electron-forge/commit/ebcd4c13))

##### New Features

- **publisher-nucleus:** add publisher-nucleus to add nucleus upload support to v6 ([131665cb](https://github.com/electron-userland/electron-forge/commit/131665cb))
- **generic:** add source-map-support for better stacktraces ([77077ce2](https://github.com/electron-userland/electron-forge/commit/77077ce2))
- **plugin-local-electron:** add plugin-local-electron ([8af92682](https://github.com/electron-userland/electron-forge/commit/8af92682))

##### Bug Fixes

- fix changelog generation ([faeec5a6](https://github.com/electron-userland/electron-forge/commit/faeec5a6))
- **core:**
  - fromBuildIdentifier moved to the utils object ([46aaf7ac](https://github.com/electron-userland/electron-forge/commit/46aaf7ac))
  - fix error log for package for new path to packagerConfig ([fef9bcd5](https://github.com/electron-userland/electron-forge/commit/fef9bcd5))

##### Refactors

- **maker:** replace zip-folder with cross-zip (#325) ([e06aa0b7](https://github.com/electron-userland/electron-forge/commit/e06aa0b7))

##### Code Style Changes

- set-up tslint ([40484e16](https://github.com/electron-userland/electron-forge/commit/40484e16))

##### Tests

- **plugin-local-electron:** add tests for the local electron plugin ([61b36329](https://github.com/electron-userland/electron-forge/commit/61b36329))

#### [6.0.0-beta.5](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.5) (2018-05-01)

##### Documentation Changes

- fix changelog generation ([3f9ec6b8](https://github.com/electron-userland/electron-forge/commit/3f9ec6b8))

##### Bug Fixes

- **core:** fix make not respecting mas as a target platform ([10b38765](https://github.com/electron-userland/electron-forge/commit/10b38765))

#### [6.0.0-beta.4](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.4) (2018-05-01)

##### Chores

- **docs:**
  - fix changelog for last 2 versions ([bc8620e0](https://github.com/electron-userland/electron-forge/commit/bc8620e0))
  - Fix image sizing in README ([74fcd749](https://github.com/electron-userland/electron-forge/commit/74fcd749))
- **generic:** upgrade @octokit/rest, ora, & proxyquire (#477) ([825c7f2c](https://github.com/electron-userland/electron-forge/commit/825c7f2c))

##### New Features

- **core:**
  - add fromBuildIdentifier helper for dynamic at-build-time config ([dc6c9fce](https://github.com/electron-userland/electron-forge/commit/dc6c9fce))
  - V6 Docs (#496) ([dab06d9c](https://github.com/electron-userland/electron-forge/commit/dab06d9c))
- **maker-pkg:** add new maker for .pkg files on macOS ([8728baa1](https://github.com/electron-userland/electron-forge/commit/8728baa1))

##### Bug Fixes

- **core:** check packageJSON.main is set and don't enforce subdir rule ([ebd9a958](https://github.com/electron-userland/electron-forge/commit/ebd9a958))

##### Refactors

- **all:** rewrote in typescript ([a3faa619](https://github.com/electron-userland/electron-forge/commit/a3faa619))

#### [6.0.0-beta.3](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.3) (2018-04-17)

#### [6.0.0-beta.2](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.2) (2018-04-16)

##### Chores

- **tools:** update dependency version for electron-forge modules to be latest on bump ([1029d32b](https://github.com/electron-userland/electron-forge/commit/1029d32b))
- **tooling:** add publish script ([c5b6c6a3](https://github.com/electron-userland/electron-forge/commit/c5b6c6a3))
- **core:** remote gitignore ([c97b25dd](https://github.com/electron-userland/electron-forge/commit/c97b25dd))
- add missing files from 6.0.0-beta.1 ([24cdcb55](https://github.com/electron-userland/electron-forge/commit/24cdcb55))

#### [6.0.0-beta.1](https://github.com/electron-userland/electron-forge/releases/tag/v6.0.0-beta.1) (2018-04-16)

##### Chores

- **generic:** upgrade to Electron Packager 12 (#478) ([cd4161a5](https://github.com/electron-userland/electron-forge/commit/cd4161a5))

##### New Features

- **core:** V6 API (#433) ([364ba8d8](https://github.com/electron-userland/electron-forge/commit/364ba8d8))
- **generic:** remove electron-compile, make forge less opinionated and quite vanilla ([d59695ec](https://github.com/electron-userland/electron-forge/commit/d59695ec))

#### [5.1.1](https://github.com/electron-userland/electron-forge/releases/tag/v5.1.1) (2018-02-15)

##### Chores

- **packager:** upgrade electron-packager to 11.0.0 ([dee72fd1](https://github.com/electron-userland/electron-forge/commit/dee72fd1))
- **generic:** upgrade node-fetch to 2.0.0 and fetch-mock to 6.0.0 ([42abee35](https://github.com/electron-userland/electron-forge/commit/42abee35))

### [5.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v5.1.0) (2018-02-05)

##### New Features

- **publisher:** add GitHub Enterprise/HTTP proxy support to the GitHub publisher ([14151022](https://github.com/electron-userland/electron-forge/commit/14151022))

## [5.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v5.0.0) (2018-02-01)

##### New Features

- **publisher:**
  - add snapcraft publisher ([c5b7d0d7](https://github.com/electron-userland/electron-forge/commit/c5b7d0d7))
  - add dir to publisher args & convert args from positional to keyword ([45ace6cf](https://github.com/electron-userland/electron-forge/commit/45ace6cf))
- **maker:** add builtin snap support ([86f987d7](https://github.com/electron-userland/electron-forge/commit/86f987d7))

### [4.3.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.3.0) (2018-01-31)

##### New Features

- **maker:** add Wix support ([76166af3](https://github.com/electron-userland/electron-forge/commit/76166af3))

##### Bug Fixes

- **maker:** wix only works on win32 currently ([707a1e33](https://github.com/electron-userland/electron-forge/commit/707a1e33))

##### Other Changes

- add Wix to PATH ([52a64080](https://github.com/electron-userland/electron-forge/commit/52a64080))

##### Refactors

- **maker:** extract author name parsing into its own function ([fa80cd3d](https://github.com/electron-userland/electron-forge/commit/fa80cd3d))

#### [4.2.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.2.1) (2018-01-29)

##### Chores

- **generic:**
  - upgrade mocha to 5.x ([01857a8e](https://github.com/electron-userland/electron-forge/commit/01857a8e))
  - upgrade electron-installer-debian to 0.8.x ([0bcedfe8](https://github.com/electron-userland/electron-forge/commit/0bcedfe8))
  - replace node-github with @octokit/rest ([e1f26075](https://github.com/electron-userland/electron-forge/commit/e1f26075))
  - upgrade github to v13 ([a80ff504](https://github.com/electron-userland/electron-forge/commit/a80ff504))
  - upgrade fs-extra to v5 and inquirer to v5 ([0ecc57dd](https://github.com/electron-userland/electron-forge/commit/0ecc57dd))

##### Documentation Changes

- **generic:** add support document & move debugging section there ([d3f610c4](https://github.com/electron-userland/electron-forge/commit/d3f610c4))

##### Bug Fixes

- **installer:** hdiutil output should be a string ([e511206b](https://github.com/electron-userland/electron-forge/commit/e511206b))

### [4.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.2.0) (2018-01-08)

##### New Features

- **generic:** allow specifying a build identifier that segregates build artifacts ([0e483659](https://github.com/electron-userland/electron-forge/commit/0e483659))
- **rebuilder:** allow configuration of electron-rebuild ([b986f264](https://github.com/electron-userland/electron-forge/commit/b986f264))

#### [4.1.9](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.9) (2018-01-08)

##### Bug Fixes

- **packager:** packager hooks should be executed sequentially ([e844b1d1](https://github.com/electron-userland/electron-forge/commit/e844b1d1))

#### [4.1.8](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.8) (2018-01-08)

##### Chores

- **maker:** upgrade electron-installer-flatpak to 0.8.0 & re-enable its tests ([9c199e0d](https://github.com/electron-userland/electron-forge/commit/9c199e0d))

##### Documentation Changes

- **starter:** add note to readme about debugging on the command line ([26f347a6](https://github.com/electron-userland/electron-forge/commit/26f347a6))
- **generic:** add link to electronforge.io repository in contributing docs ([c3332688](https://github.com/electron-userland/electron-forge/commit/c3332688))

##### Bug Fixes

- **generic:** tabtab install breaks in bash for windows ([a5f8b40f](https://github.com/electron-userland/electron-forge/commit/a5f8b40f))
- **maker:** fix detection of flatpak artifact ([4d5378c2](https://github.com/electron-userland/electron-forge/commit/4d5378c2))

#### [4.1.7](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.7) (2017-12-24)

##### Chores

- **generic:**
  - don't nonzero-exit when trying to install tabtab completions ([0e18fe34](https://github.com/electron-userland/electron-forge/commit/0e18fe34))
  - don't use deprecated mocha CLI flag ([e13e6380](https://github.com/electron-userland/electron-forge/commit/e13e6380))
- **tests:**
  - move default test config to mocha.opts file ([f681176c](https://github.com/electron-userland/electron-forge/commit/f681176c))
  - remove intermediate layer when running via Docker ([6282a115](https://github.com/electron-userland/electron-forge/commit/6282a115))
  - cache node_modules in CI ([fcef3826](https://github.com/electron-userland/electron-forge/commit/fcef3826))

##### Documentation Changes

- **packager:**
  - clarify why dir/platform can't be set in Packager config ([f2b5c4a3](https://github.com/electron-userland/electron-forge/commit/f2b5c4a3))
  - clarify why arch can't be set in Packager config ([df5a018e](https://github.com/electron-userland/electron-forge/commit/df5a018e))

##### Bug Fixes

- **packager:** package spinner isn't defined when asar.unpack is checked ([435e83d0](https://github.com/electron-userland/electron-forge/commit/435e83d0))
- **initializer:** electron versions for babel-preset-env should be strings ([35120b1c](https://github.com/electron-userland/electron-forge/commit/35120b1c))

##### Other Changes

- use yarn instead ([907a377e](https://github.com/electron-userland/electron-forge/commit/907a377e))

##### Refactors

- **generic:** Use readJson and writeJson ([1a1884d1](https://github.com/electron-userland/electron-forge/commit/1a1884d1))

#### [4.1.6](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.6) (2017-12-06)

##### Bug Fixes

- **importer:**
  - Fix typo in dependency check ([24267fe4](https://github.com/electron-userland/electron-forge/commit/24267fe4))
  - handle the case where productName doesn't exist ([23f191a8](https://github.com/electron-userland/electron-forge/commit/23f191a8))
- **generic:** assume invalid semver package manager versions are incompatible ([076c78e1](https://github.com/electron-userland/electron-forge/commit/076c78e1))

##### Refactors

- **maker:** DRY up linux config transformations ([a39011b8](https://github.com/electron-userland/electron-forge/commit/a39011b8))

#### [4.1.5](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.5) (2017-11-24)

##### Bug Fixes

- **packager:** fix custom afterCopy, afterPrune not being included ([c9e23e38](https://github.com/electron-userland/electron-forge/commit/c9e23e38))

#### [4.1.4](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.4) (2017-11-21)

##### New Features

- **packager:** add support for hook files for electronPackagerConfig.afterPrune ([e847a78e](https://github.com/electron-userland/electron-forge/commit/e847a78e))

##### Bug Fixes

- **publisher:** fix publishing a saved dry run on a different device from the initial dry run ([a2c33eb8](https://github.com/electron-userland/electron-forge/commit/a2c33eb8))
- **packager:** move the rebuild hook to after pruning finishes ([cce9db42](https://github.com/electron-userland/electron-forge/commit/cce9db42))
- **importer:** adjust Forge config defaults just like in init ([38f9a3d4](https://github.com/electron-userland/electron-forge/commit/38f9a3d4))

##### Refactors

- **packager:** resolve hook files in a common function ([08d55772](https://github.com/electron-userland/electron-forge/commit/08d55772))

#### [4.1.3](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.3) (2017-11-10)

##### Chores

- **generic:** replace the deprecated babel-preset-es2015 with babel-preset-env ([b3499edf](https://github.com/electron-userland/electron-forge/commit/b3499edf))

##### Bug Fixes

- **make:** allow building for MAS inside make logic ([5e6411ec](https://github.com/electron-userland/electron-forge/commit/5e6411ec))
- **packager:** warn if the app version is not set ([29070ca6](https://github.com/electron-userland/electron-forge/commit/29070ca6))
- **importer:** warn if the package.json being imported does not have a version ([e55ea98d](https://github.com/electron-userland/electron-forge/commit/e55ea98d))
- **starter:** throw an error if the app version is not set in package.json ([69b29958](https://github.com/electron-userland/electron-forge/commit/69b29958))

##### Tests

- **make:** add mas test ([359b2799](https://github.com/electron-userland/electron-forge/commit/359b2799))

#### [4.1.2](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.2) (2017-09-27)

##### Bug Fixes

- **generic:** correct the getOwnPropertyDescriptor proxy hook to respect current properties writabil ([8e9872bc](https://github.com/electron-userland/electron-forge/commit/8e9872bc))

#### [4.1.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.1) (2017-09-27)

##### Bug Fixes

- **generic:** ensure config proxy doesn't prevent access to built-ins ([07047889](https://github.com/electron-userland/electron-forge/commit/07047889))

### [4.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.0) (2017-09-26)

##### Chores

- **generic:**
  - upgrade electron-windows-store to 0.12 ([fcdc0a02](https://github.com/electron-userland/electron-forge/commit/fcdc0a02))
  - upgrade cz-customizable, and github ([9156296b](https://github.com/electron-userland/electron-forge/commit/9156296b))

##### Documentation Changes

- **maker:** mention that make can support non-host platforms ([6c302198](https://github.com/electron-userland/electron-forge/commit/6c302198))

##### New Features

- **initializer:** add electron-squirrel-startup to the default template ([e0e42aa2](https://github.com/electron-userland/electron-forge/commit/e0e42aa2))

##### Bug Fixes

- **generic:**
  - automatically warn w/a nightly package manager version ([d997ba0c](https://github.com/electron-userland/electron-forge/commit/d997ba0c))
  - blacklist NPM 5.4.[01] on Windows ([063caca4](https://github.com/electron-userland/electron-forge/commit/063caca4))
- **init:** run package manager commands via cross-spawn ([cbee55e2](https://github.com/electron-userland/electron-forge/commit/cbee55e2))
- **publisher:** allow config for Electron Release Server to be read from envars ([50d35374](https://github.com/electron-userland/electron-forge/commit/50d35374))
- **tests:** use a newer version of native-metrics ([1e7c175e](https://github.com/electron-userland/electron-forge/commit/1e7c175e))

##### Refactors

- **generic:**
  - use cross-spawn-promise instead of spawn-rx ([5a9848c7](https://github.com/electron-userland/electron-forge/commit/5a9848c7))
  - replace electron-host-arch with hostArch in Electron Packager ([45afdfb5](https://github.com/electron-userland/electron-forge/commit/45afdfb5))
- **maker:**
  - use makeCert from electron-windows-store ([c31ceef6](https://github.com/electron-userland/electron-forge/commit/c31ceef6))
  - use the target platform/arch API from Packager to determine "all" archs ([f9c4c20c](https://github.com/electron-userland/electron-forge/commit/f9c4c20c))

#### [4.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.2) (2017-09-10)

##### Bug Fixes

- **generic:** whitelist yarn >= 1.0.0 ([36bc34ad](https://github.com/electron-userland/electron-forge/commit/36bc34ad))
- **linter:** don't pass --color to linters that don't support it ([66354fb6](https://github.com/electron-userland/electron-forge/commit/66354fb6))
- **tests:**
  - use fakeOra properly in system spec ([bb4c7875](https://github.com/electron-userland/electron-forge/commit/bb4c7875))
  - stub ora.warn ([969a0359](https://github.com/electron-userland/electron-forge/commit/969a0359))

#### [4.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.1) (2017-9-5)

##### Bug Fixes

- **generic:** tabtab install script fails on non-\*nix systems ([fc3c0301](https://github.com/electron-userland/electron-forge/commit/fc3c0301))

## [4.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.0) (2017-08-30)

##### Chores

- **publisher:** use SHA256 instead of md5 ([c69db80f](https://github.com/electron-userland/electron-forge/commit/c69db80f))
- **generic:** upgrade Electron Packager to 9.x ([6275d2bf](https://github.com/electron-userland/electron-forge/commit/6275d2bf))

##### Documentation Changes

- **publisher:**
  - improve docs for publish function ([7766a27c](https://github.com/electron-userland/electron-forge/commit/7766a27c))
  - mention that multiple targets are allowed ([3ec0cfa6](https://github.com/electron-userland/electron-forge/commit/3ec0cfa6))
  - fix S3 config key typo ([4225683b](https://github.com/electron-userland/electron-forge/commit/4225683b))
- **maker:** document the return result of make ([5399f500](https://github.com/electron-userland/electron-forge/commit/5399f500))

##### New Features

- **publisher:** adds dryRun and resumeDryRun to the API to allow post-make publishes ([288edbc1](https://github.com/electron-userland/electron-forge/commit/288edbc1))
- **initializer:**
  - only copy CI files if specified ([fd6f2f9b](https://github.com/electron-userland/electron-forge/commit/fd6f2f9b))
  - add Travis/AppVeyor CI files to default template ([296bdde8](https://github.com/electron-userland/electron-forge/commit/296bdde8))

##### Bug Fixes

- **generic:**
  - clean up package manager warning output ([894ed0a9](https://github.com/electron-userland/electron-forge/commit/894ed0a9))
  - add yarn 0.27.5 to the whitelist, but only for darwin/linux ([88b92fce](https://github.com/electron-userland/electron-forge/commit/88b92fce))
  - fix installing tab completion when installing Forge locally ([7ea49812](https://github.com/electron-userland/electron-forge/commit/7ea49812))

##### Refactors

- **publisher:**
  - make dryRun object storage make more sense ([f8d807ed](https://github.com/electron-userland/electron-forge/commit/f8d807ed))
  - rename target option to publishTargets in API ([4b68880d](https://github.com/electron-userland/electron-forge/commit/4b68880d))
- **initializer:** make init options camelcase ([f4459822](https://github.com/electron-userland/electron-forge/commit/f4459822))

##### Tests

- **maker:** Fix make test for new return type ([d6393567](https://github.com/electron-userland/electron-forge/commit/d6393567))
- **publisher:** fix dry run specs ([d2085812](https://github.com/electron-userland/electron-forge/commit/d2085812))

### [3.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v3.2.0) (2017-08-17)

##### Chores

- **generic:**
  - use the xcode8.3 image for Travis OSX ([c24ae48c](https://github.com/electron-userland/electron-forge/commit/c24ae48c))
  - upgrade dependencies ([9d17ca9e](https://github.com/electron-userland/electron-forge/commit/9d17ca9e))
- **tests:** fixup comma arch test ([565fce42](https://github.com/electron-userland/electron-forge/commit/565fce42))

##### Documentation Changes

- **generic:** mention alternate ways of creating new Electron apps with Forge ([419962a8](https://github.com/electron-userland/electron-forge/commit/419962a8))
- **packager:** list the Packager options that are not configurable ([bb33d9b6](https://github.com/electron-userland/electron-forge/commit/bb33d9b6))

##### New Features

- **initializer:** add Forge as a devDependency to new Electron projects ([6d2cf4b0](https://github.com/electron-userland/electron-forge/commit/6d2cf4b0))
- **generic:** print a warning if the package manager used is not a known good version ([a4c36fa4](https://github.com/electron-userland/electron-forge/commit/a4c36fa4))

##### Bug Fixes

- **maker:** allow comma seperated arches in make as well as package ([9c69b08b](https://github.com/electron-userland/electron-forge/commit/9c69b08b))

#### [3.0.5](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.5) (2017-6-17)

##### Bug Fixes

- **maker:** fix debian and redhat maker path calculation ([c2dca211](https://github.com/electron-userland/electron-forge/commit/c2dca211))

#### [3.0.4](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.4) (2017-6-15)

##### Chores

- **tests:** remove unnecessary chai-fetch-mock dependency ([196a64db](https://github.com/electron-userland/electron-forge/commit/196a64db))

##### Bug Fixes

- **maker:** handle name option for the deb, rpm makers as well as dmg ([d335741a](https://github.com/electron-userland/electron-forge/commit/d335741a))
- **generic:** add executable permissions to vscode.cmd ([33532f79](https://github.com/electron-userland/electron-forge/commit/33532f79))

##### Refactors

- **installer:** replace electron-sudo with sudo-prompt ([0ea55fab](https://github.com/electron-userland/electron-forge/commit/0ea55fab))

#### [3.0.3](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.3) (2017-5-26)

##### Bug Fixes

- **initializer:** fix bad logic RE argument parsing from the top level forge command ([774b8769](https://github.com/electron-userland/electron-forge/commit/774b8769))

#### [3.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.2) (2017-5-25)

##### Bug Fixes

- **starter:** fix double dash arg pass through ([0379e5fc](https://github.com/electron-userland/electron-forge/commit/0379e5fc))
- **maker:** fix renaming of DMG output when a custom name is provided ([14cc927a](https://github.com/electron-userland/electron-forge/commit/14cc927a))
- **tests:** fix appx tests (maker did not return output path) ([8d895cfc](https://github.com/electron-userland/electron-forge/commit/8d895cfc))
- **initializer:** fix linting install for airbnb style ([b3446184](https://github.com/electron-userland/electron-forge/commit/b3446184))

##### Refactors

- **generic:** replace fs-promise with fs-extra ([012b152f](https://github.com/electron-userland/electron-forge/commit/012b152f))

##### Tests

- **maker:** add tests for the DMG maker to ensure the renaming logic is correct ([8f5f9691](https://github.com/electron-userland/electron-forge/commit/8f5f9691))

#### [3.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.1) (2017-5-3)

##### Bug Fixes

- **publisher:** fix ers publisher not publishing when version already exists ([1c643ef9](https://github.com/electron-userland/electron-forge/commit/1c643ef9))
- **maker:** fix dmg output path and add test to enforce in future ([a41d6db3](https://github.com/electron-userland/electron-forge/commit/a41d6db3))

## [3.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.0) (2017-5-1)

##### Chores

- **undefined:** fix devDependency peer dep versions ([c5c8e9a9](https://github.com/electron-userland/electron-forge/commit/c5c8e9a9))
- **generic:** add breaking changes prompt to `npm run commit` ([566fd6fb](https://github.com/electron-userland/electron-forge/commit/566fd6fb))

##### Documentation Changes

- **publisher:** add docs for the new ers publisher ([e70405a8](https://github.com/electron-userland/electron-forge/commit/e70405a8))

##### New Features

- **publisher:** add new publisher for electron-release-server ([0c68ebab](https://github.com/electron-userland/electron-forge/commit/0c68ebab))
- **makers:** Ensure all assets outputted by make are versioned ([6dda5179](https://github.com/electron-userland/electron-forge/commit/6dda5179))
- **maker:**
  - create and consume a common util to check makers' supported platforms ([fa53340b](https://github.com/electron-userland/electron-forge/commit/fa53340b))
  - declare deb maker support for darwin & linux platforms ([f10fbd18](https://github.com/electron-userland/electron-forge/commit/f10fbd18))

##### Bug Fixes

- **start:** exit forge with same status code as Electron if nonzero ([a509f55a](https://github.com/electron-userland/electron-forge/commit/a509f55a))
- **tests:** make optionFetcher-related tests compile again ([1097f8bd](https://github.com/electron-userland/electron-forge/commit/1097f8bd))
- **docs:** rm note that package api's platform opt is ignored ([eefa93f0](https://github.com/electron-userland/electron-forge/commit/eefa93f0))

##### Refactors

- **starter:** use double dash instead of triple dash to pass args through ([e3a1be64](https://github.com/electron-userland/electron-forge/commit/e3a1be64))
- **utils:** filter packages' os declarations to exclude blacklist entries ([fbaec97f](https://github.com/electron-userland/electron-forge/commit/fbaec97f))
- **maker:** support make for targets on non-host platforms ([f79f6f78](https://github.com/electron-userland/electron-forge/commit/f79f6f78))
- **util:** extend requireSearch to export a raw search fn ([84f0134b](https://github.com/electron-userland/electron-forge/commit/84f0134b))

##### Tests

- **publisher:** fix publisher tests for new syntax ([c19d1c2a](https://github.com/electron-userland/electron-forge/commit/c19d1c2a))
- **maker:** add test to confirm dummy maker does not get called ([556deaac](https://github.com/electron-userland/electron-forge/commit/556deaac))

### [2.12.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.12.0) (2017-4-25)

##### New Features

- **maker:** basic hooks for preMake, postMake, generateAssets, prePackage and postPackage ([1a17189b](https://github.com/electron-userland/electron-forge/commit/1a17189b))

##### Bug Fixes

- **maker:** do not enforce the name property on the DMG maker ([1b10fd57](https://github.com/electron-userland/electron-forge/commit/1b10fd57))

#### [2.11.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.11.1) (2017-4-19)

### [2.11.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.11.0) (2017-4-19)

##### New Features

- **maker:** allow maker configs to be functions that return values based on arch ([d9cbec5a](https://github.com/electron-userland/electron-forge/commit/d9cbec5a))

### [2.10.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.10.0) (2017-4-16)

##### Chores

- **generic:**
  - fix/rename coverage sending script ([547c044f](https://github.com/electron-userland/electron-forge/commit/547c044f))
  - update various dependencies ([0f97292c](https://github.com/electron-userland/electron-forge/commit/0f97292c))

##### New Features

- **starter:**
  - windows implementation of the vscode debug command ([9cb7f42c](https://github.com/electron-userland/electron-forge/commit/9cb7f42c))
  - provide an executable to start forge in a vscode debugger compatible way ([1238dee5](https://github.com/electron-userland/electron-forge/commit/1238dee5))

### [2.9.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.9.0) (2017-4-2)

##### Chores

- **generic:** add .editorconfig ([5aaf871e](https://github.com/electron-userland/electron-forge/commit/5aaf871e))

##### New Features

- **importer:** add configurable outDir support for gitignore ([9369284f](https://github.com/electron-userland/electron-forge/commit/9369284f))

##### Bug Fixes

- **initializer:**
  - update Electron version type in .compilerc template, for completeness ([a4fa4bfc](https://github.com/electron-userland/electron-forge/commit/a4fa4bfc))
  - set electron version to be float in init step ([710129b7](https://github.com/electron-userland/electron-forge/commit/710129b7))
- **maker:**
  - upgrade rpm maker for better package.json handling ([926032e8](https://github.com/electron-userland/electron-forge/commit/926032e8))
  - test outDir on zip target only, after other targets run ([a2c92499](https://github.com/electron-userland/electron-forge/commit/a2c92499))
  - pass computed outDir to packager ([686200f6](https://github.com/electron-userland/electron-forge/commit/686200f6))
  - search local node_modules folder for maker when installed globally ([9b8f2970](https://github.com/electron-userland/electron-forge/commit/9b8f2970))
- **tests:**
  - stop awaiting mocha and ensure we clean up out dirs ([2e6dc384](https://github.com/electron-userland/electron-forge/commit/2e6dc384))
  - use expect(await ...) syntax per @marshallofsound ([59ddf9af](https://github.com/electron-userland/electron-forge/commit/59ddf9af))
- **generic:** use path.resolve (vs /-delimited) to compute default outDir ([ff167447](https://github.com/electron-userland/electron-forge/commit/ff167447))
- **packager:** correct main file reference in thrown error from packageJson.name to .main ([a68284b1](https://github.com/electron-userland/electron-forge/commit/a68284b1))
- **publisher:** check local node_modules when searching for publisher ([42fad7f3](https://github.com/electron-userland/electron-forge/commit/42fad7f3))

##### Refactors

- **maker:** compute outDir from providedOptions w/default ([d69e7626](https://github.com/electron-userland/electron-forge/commit/d69e7626))
- **packager:** compute outDir from providedOptions w/default ([1e26d258](https://github.com/electron-userland/electron-forge/commit/1e26d258))

##### Code Style Changes

- **initializer:** fix typo ([dd6aec48](https://github.com/electron-userland/electron-forge/commit/dd6aec48))

##### Tests

- **tests:** add tests for packager & maker outDir support ([32cecffd](https://github.com/electron-userland/electron-forge/commit/32cecffd))

#### [2.8.3](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.3) (2017-3-10)

##### Chores

- **generic:**
  - update react-typescript template ([30516e78](https://github.com/electron-userland/electron-forge/commit/30516e78))
  - make release script work on windows ([0ff6a7ab](https://github.com/electron-userland/electron-forge/commit/0ff6a7ab))

##### New Features

- **starter:** automatically wipe the ELECTRON_RUN_AS_NODE variable unless specified ([c702fe4a](https://github.com/electron-userland/electron-forge/commit/c702fe4a))
- **generic:**
  - Support setting the Electron app path in start() ([47c5572e](https://github.com/electron-userland/electron-forge/commit/47c5572e))
  - allow third party modules to be named whatever they want ([fddb40e6](https://github.com/electron-userland/electron-forge/commit/fddb40e6))

##### Bug Fixes

- **publisher:** use updated node-github response API ([0f8e6c4f](https://github.com/electron-userland/electron-forge/commit/0f8e6c4f))
- **maker:**
  - fix the squirrel maker app name logic ([84031ecb](https://github.com/electron-userland/electron-forge/commit/84031ecb))
  - allow most appx default config to be overridden by the user ([b1e90538](https://github.com/electron-userland/electron-forge/commit/b1e90538))
- **tests:** ensure test project has proper metadata filled ([0bc81858](https://github.com/electron-userland/electron-forge/commit/0bc81858))

#### [2.8.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.2) (2017-2-28)

##### Chores

- **templates:** bump all template versions ([32297344](https://github.com/electron-userland/electron-forge/commit/32297344))

##### Bug Fixes

- **ci:** Use the preinstalled yarn on AppVeyor (#146) ([7a1deee7](https://github.com/electron-userland/electron-forge/commit/7a1deee7))
- **publisher:** Fix secret access key ([0a9710b5](https://github.com/electron-userland/electron-forge/commit/0a9710b5))

#### [2.8.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.1) (2017-2-23)

##### Chores

- **generic:**
  - add checkboxes and intros to the issue/PR templates ([a1ab1c3a](https://github.com/electron-userland/electron-forge/commit/a1ab1c3a))
  - fix formatting in GitHub issue template ([da95b42b](https://github.com/electron-userland/electron-forge/commit/da95b42b))
- **tests:** remove now obsolete flatpak call in Linux tests ([b93b6cfe](https://github.com/electron-userland/electron-forge/commit/b93b6cfe))

##### Documentation Changes

- **publisher:**
  - mention the standard AWS environment variables in the README ([efc7ea14](https://github.com/electron-userland/electron-forge/commit/efc7ea14))
  - add example for GitHub publish target ([3fc0a9c2](https://github.com/electron-userland/electron-forge/commit/3fc0a9c2))

##### New Features

- **packager:** remove the users forge config after packaging for safety reasons ([7432e034](https://github.com/electron-userland/electron-forge/commit/7432e034))
- **publisher:**
  - allow usage of standard AWS environment variables for S3 publishing ([d31ce248](https://github.com/electron-userland/electron-forge/commit/d31ce248))
  - add S3 publish target ([fa31902a](https://github.com/electron-userland/electron-forge/commit/fa31902a))
  - allow platform level config for publish targets ([8572cad6](https://github.com/electron-userland/electron-forge/commit/8572cad6))
- **generic:** allow config options to be automagically pulled in from process.env ([250c197f](https://github.com/electron-userland/electron-forge/commit/250c197f))

##### Bug Fixes

- **tests:**
  - fix forge config deletion tests on all platforms ([7b99e847](https://github.com/electron-userland/electron-forge/commit/7b99e847))
  - fix test failures caused by config structure changes ([3a3cdfdb](https://github.com/electron-userland/electron-forge/commit/3a3cdfdb))
- **importer:**
  - install electron-prebuilt-compile as devDep ([e80be32a](https://github.com/electron-userland/electron-forge/commit/e80be32a))
  - check updateScripts value at script install vs deps removal ([4942cb60](https://github.com/electron-userland/electron-forge/commit/4942cb60))
  - ensure electronName exists before resolving its path ([9dcf2ec5](https://github.com/electron-userland/electron-forge/commit/9dcf2ec5))
- **publisher:** throw an exception if a GitHub token isn't specified ([bc299b7a](https://github.com/electron-userland/electron-forge/commit/bc299b7a))
- **initializer:** add github_repository.name to package.json in default template ([d1ceadf3](https://github.com/electron-userland/electron-forge/commit/d1ceadf3))

##### Refactors

- **publisher:** add deprecate method call to inform the user ([24571197](https://github.com/electron-userland/electron-forge/commit/24571197))

##### Code Style Changes

- **util:** fix typo re: imagePath ([9e064cf3](https://github.com/electron-userland/electron-forge/commit/9e064cf3))

### [2.8.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.0) (2017-2-2)

##### Chores

- **gitignore:** ignore npm-debug.log files ([06b824ee](https://github.com/electron-userland/electron-forge/commit/06b824ee))

##### New Features

- **importer:** allow the implementer to decide whether to override scripts or not ([f85e194f](https://github.com/electron-userland/electron-forge/commit/f85e194f))
- **starter:** resolve start api usage with a handle to the spawned process ([b5ba30e3](https://github.com/electron-userland/electron-forge/commit/b5ba30e3))

##### Bug Fixes

- **importer:** if no electron was found install the latest version by default ([c8b12fbf](https://github.com/electron-userland/electron-forge/commit/c8b12fbf))
- **generic:** make all process.exit and console calls respect the interactive setting ([a3e43315](https://github.com/electron-userland/electron-forge/commit/a3e43315))

##### Refactors

- **generic:** add wrappers for console.info and console.warn ([f223df85](https://github.com/electron-userland/electron-forge/commit/f223df85))

##### Tests

- **starter:** add test for returned childProcess.spawn ([f2c128e4](https://github.com/electron-userland/electron-forge/commit/f2c128e4))

#### [2.7.5](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.5) (2017-1-29)

##### Chores

- **tests:** add eslint-plugin-mocha ([74397232](https://github.com/electron-userland/electron-forge/commit/74397232))
- **generic:** update electron-installer-dmg to version 0.2.0 ([aa8034b1](https://github.com/electron-userland/electron-forge/commit/aa8034b1))

##### Bug Fixes

- **tests:** update tests due to changes in #101 ([912b4f69](https://github.com/electron-userland/electron-forge/commit/912b4f69))
- **maker:** detect out path of package step correctly ([6d15c62d](https://github.com/electron-userland/electron-forge/commit/6d15c62d))
- **tabtab:** dont install tabtab in a development environment and ignore tabtab install errors ([f0cb0417](https://github.com/electron-userland/electron-forge/commit/f0cb0417))

##### Code Style Changes

- **generic:** fixed typos ([2f869d81](https://github.com/electron-userland/electron-forge/commit/2f869d81))
- **tests:** ignore intentionally wrong code in test ([f01f9907](https://github.com/electron-userland/electron-forge/commit/f01f9907))

##### Tests

- **initializer:** add nonexistent template test ([6f26c64f](https://github.com/electron-userland/electron-forge/commit/6f26c64f))
- **generic:** increase test coverage of the init API ([2c9caddf](https://github.com/electron-userland/electron-forge/commit/2c9caddf))
- **starter:** add test coverage for starter ([0d2f5712](https://github.com/electron-userland/electron-forge/commit/0d2f5712))
- **installer:** add test coverage for the installer ([4049e31c](https://github.com/electron-userland/electron-forge/commit/4049e31c))
- **tests:** increase test coverage on util modules ([6c63aafa](https://github.com/electron-userland/electron-forge/commit/6c63aafa))

#### [2.7.4](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.4) (2017-1-27)

##### Documentation Changes

- **generic:** clarify what the major package dependencies are ([559956b3](https://github.com/electron-userland/electron-forge/commit/559956b3))

##### Refactors

- **generic:** move ora.ora to an ora helper for ease of submodule use ([ee33638a](https://github.com/electron-userland/electron-forge/commit/ee33638a))

#### [2.7.3](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.3) (2017-1-25)

##### New Features

- **installer:** manually mount and scan a DMG file when installing for the .app ([7ea5af8a](https://github.com/electron-userland/electron-forge/commit/7ea5af8a))

##### Bug Fixes

- **packager:** fix resolving of afterCopy and afterExtract hook paths ([bd4df685](https://github.com/electron-userland/electron-forge/commit/bd4df685))
- **installer:** fix install prompt when multiple compatable targets found ([9a2f36c9](https://github.com/electron-userland/electron-forge/commit/9a2f36c9))

##### Code Style Changes

- **generic:** remove unnecessary eslint pragmas ([23d1aa9f](https://github.com/electron-userland/electron-forge/commit/23d1aa9f))

#### [2.7.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.2) (2017-1-18)

##### Bug Fixes

- **packager:** force upgrade to electron-rebuild 1.5.7 ([f2912db5](https://github.com/electron-userland/electron-forge/commit/f2912db5))

#### [2.7.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.1) (2017-1-15)

##### Chores

- **generic:**
  - alphabetize custom eslint rules ([e7f6eeb6](https://github.com/electron-userland/electron-forge/commit/e7f6eeb6))
  - disable the no-throw-literal eslint rule ([05f893e8](https://github.com/electron-userland/electron-forge/commit/05f893e8))

##### Bug Fixes

- **initializer:** handle local templates correctly ([42bf745a](https://github.com/electron-userland/electron-forge/commit/42bf745a))
- **alias:** fix the forge alias so that it can run the make command ([725e6b06](https://github.com/electron-userland/electron-forge/commit/725e6b06))

### [2.7.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.0) (2017-1-14)

##### Documentation Changes

- **initializer:** document the built in templates ([b0eec7c3](https://github.com/electron-userland/electron-forge/commit/b0eec7c3))

##### New Features

- **initializer:** add userland templates to forge ([bcba06a2](https://github.com/electron-userland/electron-forge/commit/bcba06a2))

### [2.6.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.6.0) (2017-1-10)

##### Chores

- **deps:** Update electron-windows-store ([761464f0](https://github.com/electron-userland/electron-forge/commit/761464f0))

##### New Features

- **importer:**
  - ensure the user is aware of any script changes we make ([cbb73e7e](https://github.com/electron-userland/electron-forge/commit/cbb73e7e))
  - import now sets the scripts section in package.json to be forge scripts ([cb01d406](https://github.com/electron-userland/electron-forge/commit/cb01d406))
- **initializer:** template package.json now includes package and make scripts ([272d9b1e](https://github.com/electron-userland/electron-forge/commit/272d9b1e))
- **rebuilder:** show rebuild progress from the electron-rebuild lifecycle ([26f23b48](https://github.com/electron-userland/electron-forge/commit/26f23b48))
- **generic:**
  - use electron-rebuild instead of generic rebuild logic ([3d26da5b](https://github.com/electron-userland/electron-forge/commit/3d26da5b))
  - add basic tab completion for top level commands ([30082bbf](https://github.com/electron-userland/electron-forge/commit/30082bbf))

##### Bug Fixes

- **packager:**
  - check asar.unpack correctly ([150ea5dd](https://github.com/electron-userland/electron-forge/commit/150ea5dd))
  - clarify entry point error messages ([969ab1ea](https://github.com/electron-userland/electron-forge/commit/969ab1ea))
  - throw errors on an uncompilable entrypoint ([b7f7b81c](https://github.com/electron-userland/electron-forge/commit/b7f7b81c))
- **initializer:**
  - unpin electron-compilers ([9e2aefaa](https://github.com/electron-userland/electron-forge/commit/9e2aefaa))
  - unpin eslint-plugin-jsx-a11y ([02b6e367](https://github.com/electron-userland/electron-forge/commit/02b6e367))
  - pin electron-compilers dependency due to typescript bug ([4ebafa8d](https://github.com/electron-userland/electron-forge/commit/4ebafa8d))

##### Refactors

- **packager:** upgrade to Electron Packager 8.5.0 ([b8489b47](https://github.com/electron-userland/electron-forge/commit/b8489b47))

#### [2.5.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.2) (2017-1-7)

##### Bug Fixes

- **publisher:** dont call make twice while publishing ([55bfe1ac](https://github.com/electron-userland/electron-forge/commit/55bfe1ac))

#### [2.5.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.1) (2017-1-5)

##### Chores

- **undefined:**
  - istanbul-lib-instrument is no longer required ([f60dd586](https://github.com/electron-userland/electron-forge/commit/f60dd586))
  - upgrade to version of babel-plugin-istanbul that should address regression ([0913506b](https://github.com/electron-userland/electron-forge/commit/0913506b))

##### Bug Fixes

- **importer:** fix relative path to tmpl directory ([b39c1008](https://github.com/electron-userland/electron-forge/commit/b39c1008))
- **undefined:** regression in istanbul-lib-instrument and babel-plugin-istanbul should now be addressed ([58b9791e](https://github.com/electron-userland/electron-forge/commit/58b9791e))

### [2.5.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.0) (2017-1-3)

##### Chores

- **generic:**
  - only publish CI coverage on success ([7fbbef72](https://github.com/electron-userland/electron-forge/commit/7fbbef72))
  - enable coveralls ([2f821155](https://github.com/electron-userland/electron-forge/commit/2f821155))
- **tests:**
  - fix appx tests on rebased branch ([75f217a5](https://github.com/electron-userland/electron-forge/commit/75f217a5))
  - move tests to be unit tests on the API and enable coverage ([54603c1e](https://github.com/electron-userland/electron-forge/commit/54603c1e))

##### Documentation Changes

- **generic:**
  - fix option variable names ([0923ac1e](https://github.com/electron-userland/electron-forge/commit/0923ac1e))
  - cleanup API docs ([9c118a4f](https://github.com/electron-userland/electron-forge/commit/9c118a4f))
  - add doc formatting guidelines based off of pycodestyle ([6efa5259](https://github.com/electron-userland/electron-forge/commit/6efa5259))
- **importer:**
  - tweak description ([e885cd5e](https://github.com/electron-userland/electron-forge/commit/e885cd5e))
  - mention import in the README ([d5eab37a](https://github.com/electron-userland/electron-forge/commit/d5eab37a))

##### New Features

- **generic:**
  - expose some util methods through JS API ([a506dd33](https://github.com/electron-userland/electron-forge/commit/a506dd33))
  - expose top level methods as JS APIs ([93fb48f5](https://github.com/electron-userland/electron-forge/commit/93fb48f5))
- **publisher:** add draft and prerelease options for publishing to github ([898de235](https://github.com/electron-userland/electron-forge/commit/898de235))

##### Bug Fixes

- **generic:** lock istanbul dependency versions to prevent bug ([205104c4](https://github.com/electron-userland/electron-forge/commit/205104c4))

##### Refactors

- **generic:** refactor confirm prompts into a helper for interactive mode ([b495012e](https://github.com/electron-userland/electron-forge/commit/b495012e))

##### Tests

- **generic:** add tests for lots of the utils ([d0962b93](https://github.com/electron-userland/electron-forge/commit/d0962b93))

### [2.4.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.4.0) (2017-1-3)

##### New Features

- **maker:** add support for Windows Store (AppX) packages ([74a12163](https://github.com/electron-userland/electron-forge/commit/74a12163))
- **starter:** switch the default Babel preset to use babel-preset-env ([4e3bb17b](https://github.com/electron-userland/electron-forge/commit/4e3bb17b))

##### Bug Fixes

- **starter:** ensure linebreak-style is disabled ([ac7a20bc](https://github.com/electron-userland/electron-forge/commit/ac7a20bc))

### [2.3.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.3.0) (2017-1-1)

##### Chores

- **installer:** use the ora helper in the install command ([9358eb42](https://github.com/electron-userland/electron-forge/commit/9358eb42))
- **generic:**
  - add installer to cz config ([3b253b11](https://github.com/electron-userland/electron-forge/commit/3b253b11))
  - only send slack notifications on build change ([838d70e7](https://github.com/electron-userland/electron-forge/commit/838d70e7))
- **tests:** make sure ora knows that the Docker container is for CI ([41d25ea7](https://github.com/electron-userland/electron-forge/commit/41d25ea7))

##### New Features

- **installer:**
  - add rpm installer ([f8f9baa5](https://github.com/electron-userland/electron-forge/commit/f8f9baa5))
  - don't suffix temp install files with .forge-install ([1c2bfd81](https://github.com/electron-userland/electron-forge/commit/1c2bfd81))
  - add deb installer ([fb217c74](https://github.com/electron-userland/electron-forge/commit/fb217c74))
  - add DMG support for macOS installer ([3465d261](https://github.com/electron-userland/electron-forge/commit/3465d261))
  - add inital app installer for macOS platform ([da3150d9](https://github.com/electron-userland/electron-forge/commit/da3150d9))
- **generic:**
  - use an ora/promise helper instead of a global uncaughtRejection handler (#50) ([1b6b7276](https://github.com/electron-userland/electron-forge/commit/1b6b7276))
  - travis build notifications ([d25f1461](https://github.com/electron-userland/electron-forge/commit/d25f1461))

##### Bug Fixes

- **installer:**
  - fix installer debug key ([24454950](https://github.com/electron-userland/electron-forge/commit/24454950))
  - dont fetch prerelease versions unless instructed ([1b88b153](https://github.com/electron-userland/electron-forge/commit/1b88b153))
  - await promises through the linux install chain ([a0b5ac70](https://github.com/electron-userland/electron-forge/commit/a0b5ac70))
  - remove flatpak check ([0b044134](https://github.com/electron-userland/electron-forge/commit/0b044134))
  - wildcard the extension matchers ([1489e641](https://github.com/electron-userland/electron-forge/commit/1489e641))

##### Refactors

- **installer:**
  - use single regexp to make repo path safe ([1255803b](https://github.com/electron-userland/electron-forge/commit/1255803b))
  - finish replacing sudo-prompt with electron-sudo ([d8587930](https://github.com/electron-userland/electron-forge/commit/d8587930))
  - replace sudo-prompt with git branch of electron-sudo for Linux installers ([9834cb1b](https://github.com/electron-userland/electron-forge/commit/9834cb1b))
  - check that the linux installer program exists first ([fb56c542](https://github.com/electron-userland/electron-forge/commit/fb56c542))
  - update the ora text wh have resolved a repo but not found a release ([5cbf8cb8](https://github.com/electron-userland/electron-forge/commit/5cbf8cb8))

### [2.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.2.0) (2016-12-30)

##### New Features

- **initializer:** allow custom initialzers ([9e6ddfa0](https://github.com/electron-userland/electron-forge/commit/9e6ddfa0))

##### Tests

- **initializer:** add test for custom initializer ([0dc62307](https://github.com/electron-userland/electron-forge/commit/0dc62307))

### [2.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.1.0) (2016-12-30)

##### Chores

- **generic:** add importer to the git-cz list ([fbf691cb](https://github.com/electron-userland/electron-forge/commit/fbf691cb))
- **tests:** remove .only from util_spec ([3b01f08c](https://github.com/electron-userland/electron-forge/commit/3b01f08c))

##### New Features

- **importer:**
  - confirm build tool package removal from user ([3b548557](https://github.com/electron-userland/electron-forge/commit/3b548557))
  - delete existing Electron build tools from package.json ([4152bd2d](https://github.com/electron-userland/electron-forge/commit/4152bd2d))
  - move babel config in existing project to .compilerc ([b09fc3d6](https://github.com/electron-userland/electron-forge/commit/b09fc3d6))
  - fix the projects gitignore on import ([75366bfe](https://github.com/electron-userland/electron-forge/commit/75366bfe))
  - create inital import logic ([bddb9038](https://github.com/electron-userland/electron-forge/commit/bddb9038))
- **maker:** allow user to override make targets ([bac86800](https://github.com/electron-userland/electron-forge/commit/bac86800))
- **generic:** allow config options to use string templating ([5a568cb8](https://github.com/electron-userland/electron-forge/commit/5a568cb8))

##### Bug Fixes

- **importer:**
  - pretty print the compilerc file ([07f06b40](https://github.com/electron-userland/electron-forge/commit/07f06b40))
  - update the logging as per PR feedback ([dac33f0d](https://github.com/electron-userland/electron-forge/commit/dac33f0d))
- **rebuild:** skip dependencies without a package.json file ([3348223d](https://github.com/electron-userland/electron-forge/commit/3348223d))
- **packager:** remove stray .bin files leftover by yarn installs during packaging ([50ad8e6d](https://github.com/electron-userland/electron-forge/commit/50ad8e6d))

##### Refactors

- **importer:**
  - use readPackageJSON ([e000eaf1](https://github.com/electron-userland/electron-forge/commit/e000eaf1))
  - de-rimrafify ([df4193a4](https://github.com/electron-userland/electron-forge/commit/df4193a4))

## [2.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.0.0) (2016-12-30)

##### Chores

- **generic:** add publisher to cz config ([8653b62b](https://github.com/electron-userland/electron-forge/commit/8653b62b))

##### Documentation Changes

- **publisher:** document the API for custom makers and publishers ([81ed28d7](https://github.com/electron-userland/electron-forge/commit/81ed28d7))

##### New Features

- **publisher:** initial work on a publish command to sent make artifacts to github ([189cb0cc](https://github.com/electron-userland/electron-forge/commit/189cb0cc))
- **generic:** map the alias bin commands to the correct commander files ([f1cac740](https://github.com/electron-userland/electron-forge/commit/f1cac740))

##### Bug Fixes

- **publisher:**
  - publish to the correct version ([02fe5699](https://github.com/electron-userland/electron-forge/commit/02fe5699))
  - throw custom 404 if we cant find the release ([6f4e1ed4](https://github.com/electron-userland/electron-forge/commit/6f4e1ed4))
- **maker:** fix RPM maker outPath variable ([4b32fe42](https://github.com/electron-userland/electron-forge/commit/4b32fe42))

##### Refactors

- **publisher:** move github publish logic to own file ([bdaff3ce](https://github.com/electron-userland/electron-forge/commit/bdaff3ce))

##### Tests

- **generic:** add tests for the require-search util ([b7930eaa](https://github.com/electron-userland/electron-forge/commit/b7930eaa))

### [1.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v1.1.0) (2016-12-27)

##### Chores

- **tests:** run flatpak runtime install in local Dockerfile ([d046965f](https://github.com/electron-userland/electron-forge/commit/d046965f))
- **generic:** add pretest step to improve development ([558fae31](https://github.com/electron-userland/electron-forge/commit/558fae31))
- **packages:** upgrade fs-promise and inquirer (#18) ([d51d482f](https://github.com/electron-userland/electron-forge/commit/d51d482f))

##### Documentation Changes

- **generic:** document the new JS file option for config ([2d44c41f](https://github.com/electron-userland/electron-forge/commit/2d44c41f))

##### New Features

- **rebuilder:** only rebuild prod and optional deps (ignore dev deps) ([d751a85f](https://github.com/electron-userland/electron-forge/commit/d751a85f))
- **generic:** allow JS files to provide the config object ([e57f3c78](https://github.com/electron-userland/electron-forge/commit/e57f3c78))

##### Bug Fixes

- **packager:** allow hooks to be strings or functions depending on config setup ([ec0caecc](https://github.com/electron-userland/electron-forge/commit/ec0caecc))
- **rebuilder:** rebuild modules inside @ scoped folders as well (#19) ([bc21528d](https://github.com/electron-userland/electron-forge/commit/bc21528d))
- **generic:** document that the minimum Node version is 6 ([1f5ac7f2](https://github.com/electron-userland/electron-forge/commit/1f5ac7f2))

##### Refactors

- **generic:**
  - standardize reading package.json files (#33) ([0855eacf](https://github.com/electron-userland/electron-forge/commit/0855eacf))
  - replace mkdirp/rimraf calls with equivalent fs-promise calls ([bb2c6cf3](https://github.com/electron-userland/electron-forge/commit/bb2c6cf3))
- **tests:** use different native modules so the tests run on CI ([d20387b7](https://github.com/electron-userland/electron-forge/commit/d20387b7))

##### Tests

- **generic:** only skip help spec on Windows (#34) ([202987e1](https://github.com/electron-userland/electron-forge/commit/202987e1))
- **builder:** add tests to ensure correct behvior of the native module builder ([b79c7af5](https://github.com/electron-userland/electron-forge/commit/b79c7af5))

#### [1.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v1.0.1) (2016-12-12)

##### Chores

- **tests:** add AppVeyor support (#15) ([fe63ac0b](https://github.com/electron-userland/electron-forge/commit/fe63ac0b))

##### Bug Fixes

- **starter:** fix launching on newest yarn ([8c5bc656](https://github.com/electron-userland/electron-forge/commit/8c5bc656))

## [1.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v1.0.0) (2016-12-11)

##### Chores

- **generic:**
  - rename all instances of marshallofsound to electron-userland ([9981fcbb](https://github.com/electron-userland/electron-forge/commit/9981fcbb))
  - fix changelog link parsing ([07defb76](https://github.com/electron-userland/electron-forge/commit/07defb76))
- **packager:** remove commented code ([35745594](https://github.com/electron-userland/electron-forge/commit/35745594))
- **maker:** add mas default targets ([775459cd](https://github.com/electron-userland/electron-forge/commit/775459cd))

##### New Features

- **maker:**
  - enable MAS makes on darwin platform ([d8ac9ad8](https://github.com/electron-userland/electron-forge/commit/d8ac9ad8))
  - allow make to target different or multiple arches ([3d4ee593](https://github.com/electron-userland/electron-forge/commit/3d4ee593))

##### Bug Fixes

- **maker:** build armv7l distributables when arch=all ([f6d28c32](https://github.com/electron-userland/electron-forge/commit/f6d28c32))
- **packager:**
  - change arch name when armv7l is packaged during arch=all ([132b3670](https://github.com/electron-userland/electron-forge/commit/132b3670))
  - fix the third arch ora on linux ([894fd4e7](https://github.com/electron-userland/electron-forge/commit/894fd4e7))
  - fix ora sequencing when running with --arch=all ([e4dfdede](https://github.com/electron-userland/electron-forge/commit/e4dfdede))

##### Refactors

- **generic:** replace process.arch with a function that handles arm arches better ([81fa0943](https://github.com/electron-userland/electron-forge/commit/81fa0943))

### [0.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v0.1.0) (2016-12-11)

##### Chores

- **tests:**
  - install g++ since Docker Hub won't create a new image ([f219e994](https://github.com/electron-userland/electron-forge/commit/f219e994))
  - disable building branches on Travis CI ([12e5d99e](https://github.com/electron-userland/electron-forge/commit/12e5d99e))
- **initializer:** output logs of the install step on failure ([20c0b12a](https://github.com/electron-userland/electron-forge/commit/20c0b12a))
- **generic:**
  - make the changelog link to the relevent commits ([ee6a7d86](https://github.com/electron-userland/electron-forge/commit/ee6a7d86))
  - set up changelog generation ([9a3854f1](https://github.com/electron-userland/electron-forge/commit/9a3854f1))

##### Documentation Changes

- **generic:**
  - add contributing/issue/pull request docs + news ([d25d701d](https://github.com/electron-userland/electron-forge/commit/d25d701d))
  - clean up README ([eddd61d8](https://github.com/electron-userland/electron-forge/commit/eddd61d8))
- **packager:** fix syntax of hook docs ([84a1a063](https://github.com/electron-userland/electron-forge/commit/84a1a063))

##### New Features

- **packager:** rebuild native modules automatically in all the right places ([1d1ff74d](https://github.com/electron-userland/electron-forge/commit/1d1ff74d))

##### Bug Fixes

- **packager:**
  - output rebuild errors if there are any ([f8ffca13](https://github.com/electron-userland/electron-forge/commit/f8ffca13))
  - rebuild pre-gyp modules with their binary variables ([ed9137dd](https://github.com/electron-userland/electron-forge/commit/ed9137dd))

##### Refactors

- **packager:** make the rebuild a promise and use an ora ([bc1ec28d](https://github.com/electron-userland/electron-forge/commit/bc1ec28d))

#### [0.0.9](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.9) (2016-12-11)

##### Documentation Changes

- **packager:** document the require mapping of the hooks ([87fb6aa6](https://github.com/electron-userland/electron-forge/commit/87fb6aa6))

##### New Features

- **packager:** map afterExtract hooks to require calls ([623a0001](https://github.com/electron-userland/electron-forge/commit/623a0001))

#### [0.0.8](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.8) (2016-12-11)

##### New Features

- **maker:** add the flatpak maker for the linux target ([218518ef](https://github.com/electron-userland/electron-forge/commit/218518ef))

##### Refactors

- **packager:**
  - move packager compile logic to a electron-packager afterCopy hook ([c10bcd29](https://github.com/electron-userland/electron-forge/commit/c10bcd29))
  - upgrade to Electron Packager 8.4.0 (with quiet option) ([9ab19b5f](https://github.com/electron-userland/electron-forge/commit/9ab19b5f))

#### [0.0.7](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.7) (2016-12-11)

##### Documentation Changes

- **generic:**
  - tweak the readme ([c6ededf6](https://github.com/electron-userland/electron-forge/commit/c6ededf6))
  - update readme ([f03ffeb5](https://github.com/electron-userland/electron-forge/commit/f03ffeb5))

##### Bug Fixes

- **starter:** pass through env to started application ([834729fb](https://github.com/electron-userland/electron-forge/commit/834729fb))
- **maker:** spawn the zip command in the containing directory ([e909a0c4](https://github.com/electron-userland/electron-forge/commit/e909a0c4))
- **initializer:** add electron-compile to the prod dependencies of the initialized app ([5a56efb9](https://github.com/electron-userland/electron-forge/commit/5a56efb9))

#### [0.0.6](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.6) (2016-12-11)

##### Chores

- **tests:**
  - run different package installers in different Travis workers ([028bcfbf](https://github.com/electron-userland/electron-forge/commit/028bcfbf))
  - run Travis with OSX and Linux workers ([9d1b0291](https://github.com/electron-userland/electron-forge/commit/9d1b0291))

##### Documentation Changes

- **README:**
  - fix license badge url ([026141c0](https://github.com/electron-userland/electron-forge/commit/026141c0))
  - add badges to the readme ([f912c24f](https://github.com/electron-userland/electron-forge/commit/f912c24f))
- **LICENSE:** add a license file ([89ada6e9](https://github.com/electron-userland/electron-forge/commit/89ada6e9))

##### New Features

- **maker:**
  - add the rpm maker for the linux target ([85821f27](https://github.com/electron-userland/electron-forge/commit/85821f27))
  - add the deb maker for the linux target ([5c5ce67a](https://github.com/electron-userland/electron-forge/commit/5c5ce67a))
  - add the dmg maker for the darwin target ([aaceb3f2](https://github.com/electron-userland/electron-forge/commit/aaceb3f2))
- **build:** add git-cz for semantic versioned commits ([cdbc78b6](https://github.com/electron-userland/electron-forge/commit/cdbc78b6))

##### Bug Fixes

- **maker:**
  - add a santizied app id to the electronWinstaller config on init ([20ae889e](https://github.com/electron-userland/electron-forge/commit/20ae889e))
  - move electron-installer-debian to optional deps so that installs work on windows ([661b1eb6](https://github.com/electron-userland/electron-forge/commit/661b1eb6))
  - correct path/arch of generated deb file ([63ff52b2](https://github.com/electron-userland/electron-forge/commit/63ff52b2))
- **generic:** fix package.json warning about repository ([f21a87aa](https://github.com/electron-userland/electron-forge/commit/f21a87aa))
- **packager:** throw error when electron-prebuilt-compile is not found ([23449956](https://github.com/electron-userland/electron-forge/commit/23449956))

##### Refactors

- **maker:**
  - DRY up app name ([f5ae494f](https://github.com/electron-userland/electron-forge/commit/f5ae494f))
  - add packageJSON to the function arguments ([e8e1054a](https://github.com/electron-userland/electron-forge/commit/e8e1054a))
  - create ensure{Directory,File} to rimraf+mkdirp the given output ([b3b616a0](https://github.com/electron-userland/electron-forge/commit/b3b616a0))
- **generic:**
  - add debug calls to the linter ([3e116109](https://github.com/electron-userland/electron-forge/commit/3e116109))
  - add the 'debug' module for standard debug logging ([9f4c0b49](https://github.com/electron-userland/electron-forge/commit/9f4c0b49))
- **packager:**
  - remove stray log ([f4f36b59](https://github.com/electron-userland/electron-forge/commit/f4f36b59))
  - move the electron-packager dependency to forge instead of the users module ([2e695c21](https://github.com/electron-userland/electron-forge/commit/2e695c21))

##### Code Style Changes

- **generic:**
  - disable some eslint rules that don't make sense in a CLI tool ([f1f06acf](https://github.com/electron-userland/electron-forge/commit/f1f06acf))
  - change eslint rules to allow strange linebreaks ([4b7a22e3](https://github.com/electron-userland/electron-forge/commit/4b7a22e3))

##### Tests

- **resolve-dir:** add a fixture that is actually an electron-forge package.json file ([e0e712dd](https://github.com/electron-userland/electron-forge/commit/e0e712dd))

#### [0.0.5](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.5) (2016-12-11)

#### [0.0.4](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.4) (2016-12-11)

#### [0.0.3](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.3) (2016-12-11)

#### [0.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.2) (2016-12-11)

#### [0.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.1) (2016-12-11)
