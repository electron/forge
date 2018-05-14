#### [5.2.2](https://github.com/electron-userland/electron-forge/releases/tag/v5.2.2) (2018-05-14)

##### Bug Fixes

* **packager:**  disable the all option (#509) ([602f030f](https://github.com/electron-userland/electron-forge/commit/602f030f))

#### [5.2.1](https://github.com/electron-userland/electron-forge/releases/tag/v5.2.1) (2018-05-07)

##### Bug Fixes

* **publisher:**  remove deprecated option from @octokit/rest params ([15a6879f](https://github.com/electron-userland/electron-forge/commit/15a6879f))
* **initializer:**  fix setting Electron version in.compilerc when it's x.0 (#506) ([e26de71c](https://github.com/electron-userland/electron-forge/commit/e26de71c))

### [5.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v5.2.0) (2018-04-15)

##### New Features

* **publisher:**  Allow custom release channel for ERS (#474) ([2f1888e7](https://github.com/electron-userland/electron-forge/commit/2f1888e7))
* **generic:**  allow specifying electron-prebuilt-compile via URL ([05874ae9](https://github.com/electron-userland/electron-forge/commit/05874ae9))

##### Refactors

* **generic:**  incorporate changes requested in PR ([489a25ce](https://github.com/electron-userland/electron-forge/commit/489a25ce))
* **packager:**  decouple electron version from packageJSON ([1075d68a](https://github.com/electron-userland/electron-forge/commit/1075d68a))

#### [5.1.2](https://github.com/electron-userland/electron-forge/releases/tag/v5.1.2) (2018-04-10)

##### Documentation Changes

* **publisher:**  fix publisher api doc in readme ([f2094ca2](https://github.com/electron-userland/electron-forge/commit/f2094ca2))

##### Bug Fixes

* **publisher:**  call resolve() when electron-release-server publisher succeeds ([38c29d45](https://github.com/electron-userland/electron-forge/commit/38c29d45))

##### Other Changes

*  set snapcraft debug so the build doesn't time out ([fe897a49](https://github.com/electron-userland/electron-forge/commit/fe897a49))

#### [5.1.1](https://github.com/electron-userland/electron-forge/releases/tag/v5.1.1) (2018-02-15)

##### Chores

* **packager:**  upgrade electron-packager to 11.0.0 ([dee72fd1](https://github.com/electron-userland/electron-forge/commit/dee72fd1))
* **generic:**  upgrade node-fetch to 2.0.0 and fetch-mock to 6.0.0 ([42abee35](https://github.com/electron-userland/electron-forge/commit/42abee35))

### [5.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v5.1.0) (2018-02-05)

##### New Features

* **publisher:**  add GitHub Enterprise/HTTP proxy support to the GitHub publisher ([14151022](https://github.com/electron-userland/electron-forge/commit/14151022))

## [5.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v5.0.0) (2018-02-01)

##### New Features

* **publisher:**
  *  add snapcraft publisher ([c5b7d0d7](https://github.com/electron-userland/electron-forge/commit/c5b7d0d7))
  *  add dir to publisher args & convert args from positional to keyword ([45ace6cf](https://github.com/electron-userland/electron-forge/commit/45ace6cf))
* **maker:**  add builtin snap support ([86f987d7](https://github.com/electron-userland/electron-forge/commit/86f987d7))

### [4.3.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.3.0) (2018-01-31)

##### New Features

* **maker:**  add Wix support ([76166af3](https://github.com/electron-userland/electron-forge/commit/76166af3))

##### Bug Fixes

* **maker:**  wix only works on win32 currently ([707a1e33](https://github.com/electron-userland/electron-forge/commit/707a1e33))

##### Other Changes

*  add Wix to PATH ([52a64080](https://github.com/electron-userland/electron-forge/commit/52a64080))

##### Refactors

* **maker:**  extract author name parsing into its own function ([fa80cd3d](https://github.com/electron-userland/electron-forge/commit/fa80cd3d))

#### [4.2.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.2.1) (2018-01-29)

##### Chores

* **generic:**
  *  upgrade mocha to 5.x ([01857a8e](https://github.com/electron-userland/electron-forge/commit/01857a8e))
  *  upgrade electron-installer-debian to 0.8.x ([0bcedfe8](https://github.com/electron-userland/electron-forge/commit/0bcedfe8))
  *  replace node-github with @octokit/rest ([e1f26075](https://github.com/electron-userland/electron-forge/commit/e1f26075))
  *  upgrade github to v13 ([a80ff504](https://github.com/electron-userland/electron-forge/commit/a80ff504))
  *  upgrade fs-extra to v5 and inquirer to v5 ([0ecc57dd](https://github.com/electron-userland/electron-forge/commit/0ecc57dd))

##### Documentation Changes

* **generic:**  add support document & move debugging section there ([d3f610c4](https://github.com/electron-userland/electron-forge/commit/d3f610c4))

##### Bug Fixes

* **installer:**  hdiutil output should be a string ([e511206b](https://github.com/electron-userland/electron-forge/commit/e511206b))

### [4.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.2.0) (2018-01-08)

##### New Features

* **generic:**  allow specifying a build identifier that segregates build artifacts ([0e483659](https://github.com/electron-userland/electron-forge/commit/0e483659))
* **rebuilder:**  allow configuration of electron-rebuild ([b986f264](https://github.com/electron-userland/electron-forge/commit/b986f264))

#### [4.1.9](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.9) (2018-01-08)

##### Bug Fixes

* **packager:**  packager hooks should be executed sequentially ([e844b1d1](https://github.com/electron-userland/electron-forge/commit/e844b1d1))

#### [4.1.8](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.8) (2018-01-08)

##### Chores

* **maker:** upgrade electron-installer-flatpak to 0.8.0 & re-enable its tests ([9c199e0d](https://github.com/electron-userland/electron-forge/commit/9c199e0d))

##### Documentation Changes

* **starter:** add note to readme about debugging on the command line ([26f347a6](https://github.com/electron-userland/electron-forge/commit/26f347a6))
* **generic:** add link to electronforge.io repository in contributing docs ([c3332688](https://github.com/electron-userland/electron-forge/commit/c3332688))

##### Bug Fixes

* **generic:** tabtab install breaks in bash for windows ([a5f8b40f](https://github.com/electron-userland/electron-forge/commit/a5f8b40f))
* **maker:** fix detection of flatpak artifact ([4d5378c2](https://github.com/electron-userland/electron-forge/commit/4d5378c2))

#### [4.1.7](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.7) (2017-12-24)

##### Chores

* **generic:**
  *  don't nonzero-exit when trying to install tabtab completions ([0e18fe34](https://github.com/electron-userland/electron-forge/commit/0e18fe34))
  *  don't use deprecated mocha CLI flag ([e13e6380](https://github.com/electron-userland/electron-forge/commit/e13e6380))
* **tests:**
  *  move default test config to mocha.opts file ([f681176c](https://github.com/electron-userland/electron-forge/commit/f681176c))
  *  remove intermediate layer when running via Docker ([6282a115](https://github.com/electron-userland/electron-forge/commit/6282a115))
  *  cache node_modules in CI ([fcef3826](https://github.com/electron-userland/electron-forge/commit/fcef3826))

##### Documentation Changes

* **packager:**
  *  clarify why dir/platform can't be set in Packager config ([f2b5c4a3](https://github.com/electron-userland/electron-forge/commit/f2b5c4a3))
  *  clarify why arch can't be set in Packager config ([df5a018e](https://github.com/electron-userland/electron-forge/commit/df5a018e))

##### Bug Fixes

* **packager:**  package spinner isn't defined when asar.unpack is checked ([435e83d0](https://github.com/electron-userland/electron-forge/commit/435e83d0))
* **initializer:**  electron versions for babel-preset-env should be strings ([35120b1c](https://github.com/electron-userland/electron-forge/commit/35120b1c))

##### Other Changes

*  use yarn instead ([907a377e](https://github.com/electron-userland/electron-forge/commit/907a377e))

##### Refactors

* **generic:**  Use readJson and writeJson ([1a1884d1](https://github.com/electron-userland/electron-forge/commit/1a1884d1))

#### [4.1.6](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.6) (2017-12-06)

##### Bug Fixes

* **importer:**
  * Fix typo in dependency check ([24267fe4](https://github.com/electron-userland/electron-forge/commit/24267fe4))
  * handle the case where productName doesn't exist ([23f191a8](https://github.com/electron-userland/electron-forge/commit/23f191a8))
* **generic:** assume invalid semver package manager versions are incompatible ([076c78e1](https://github.com/electron-userland/electron-forge/commit/076c78e1))

##### Refactors

* **maker:** DRY up linux config transformations ([a39011b8](https://github.com/electron-userland/electron-forge/commit/a39011b8))

#### [4.1.5](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.5) (2017-11-24)

##### Bug Fixes

* **packager:** fix custom afterCopy, afterPrune not being included ([c9e23e38](https://github.com/electron-userland/electron-forge/commit/c9e23e38))

#### [4.1.4](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.4) (2017-11-21)

##### New Features

* **packager:** add support for hook files for electronPackagerConfig.afterPrune ([e847a78e](https://github.com/electron-userland/electron-forge/commit/e847a78e))

##### Bug Fixes

* **publisher:** fix publishing a saved dry run on a different device from the initial dry run ([a2c33eb8](https://github.com/electron-userland/electron-forge/commit/a2c33eb8))
* **packager:** move the rebuild hook to after pruning finishes ([cce9db42](https://github.com/electron-userland/electron-forge/commit/cce9db42))
* **importer:** adjust Forge config defaults just like in init ([38f9a3d4](https://github.com/electron-userland/electron-forge/commit/38f9a3d4))

##### Refactors

* **packager:** resolve hook files in a common function ([08d55772](https://github.com/electron-userland/electron-forge/commit/08d55772))

#### [4.1.3](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.3) (2017-11-10)

##### Chores

* **generic:** replace the deprecated babel-preset-es2015 with babel-preset-env ([b3499edf](https://github.com/electron-userland/electron-forge/commit/b3499edf))

##### Bug Fixes

* **make:** allow building for MAS inside make logic ([5e6411ec](https://github.com/electron-userland/electron-forge/commit/5e6411ec))
* **packager:** warn if the app version is not set ([29070ca6](https://github.com/electron-userland/electron-forge/commit/29070ca6))
* **importer:** warn if the package.json being imported does not have a version ([e55ea98d](https://github.com/electron-userland/electron-forge/commit/e55ea98d))
* **starter:** throw an error if the app version is not set in package.json ([69b29958](https://github.com/electron-userland/electron-forge/commit/69b29958))

##### Tests

* **make:** add mas test ([359b2799](https://github.com/electron-userland/electron-forge/commit/359b2799))

#### [4.1.2](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.2) (2017-09-27)

##### Bug Fixes

* **generic:** correct the getOwnPropertyDescriptor proxy hook to respect current properties writabil ([8e9872bc](https://github.com/electron-userland/electron-forge/commit/8e9872bc))

#### [4.1.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.1) (2017-09-27)

##### Bug Fixes

* **generic:** ensure config proxy doesn't prevent access to built-ins ([07047889](https://github.com/electron-userland/electron-forge/commit/07047889))

### [4.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.1.0) (2017-09-26)

##### Chores

* **generic:**
  * upgrade electron-windows-store to 0.12 ([fcdc0a02](https://github.com/electron-userland/electron-forge/commit/fcdc0a02))
  * upgrade cz-customizable, and github ([9156296b](https://github.com/electron-userland/electron-forge/commit/9156296b))

##### Documentation Changes

* **maker:** mention that make can support non-host platforms ([6c302198](https://github.com/electron-userland/electron-forge/commit/6c302198))

##### New Features

* **initializer:** add electron-squirrel-startup to the default template ([e0e42aa2](https://github.com/electron-userland/electron-forge/commit/e0e42aa2))

##### Bug Fixes

* **generic:**
  * automatically warn w/a nightly package manager version ([d997ba0c](https://github.com/electron-userland/electron-forge/commit/d997ba0c))
  * blacklist NPM 5.4.[01] on Windows ([063caca4](https://github.com/electron-userland/electron-forge/commit/063caca4))
* **init:** run package manager commands via cross-spawn ([cbee55e2](https://github.com/electron-userland/electron-forge/commit/cbee55e2))
* **publisher:** allow config for Electron Release Server to be read from envars ([50d35374](https://github.com/electron-userland/electron-forge/commit/50d35374))
* **tests:** use a newer version of native-metrics ([1e7c175e](https://github.com/electron-userland/electron-forge/commit/1e7c175e))

##### Refactors

* **generic:**
  * use cross-spawn-promise instead of spawn-rx ([5a9848c7](https://github.com/electron-userland/electron-forge/commit/5a9848c7))
  * replace electron-host-arch with hostArch in Electron Packager ([45afdfb5](https://github.com/electron-userland/electron-forge/commit/45afdfb5))
* **maker:**
  * use makeCert from electron-windows-store ([c31ceef6](https://github.com/electron-userland/electron-forge/commit/c31ceef6))
  * use the target platform/arch API from Packager to determine "all" archs ([f9c4c20c](https://github.com/electron-userland/electron-forge/commit/f9c4c20c))

#### [4.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.2) (2017-09-10)

##### Bug Fixes

* **generic:** whitelist yarn >= 1.0.0 ([36bc34ad](https://github.com/electron-userland/electron-forge/commit/36bc34ad))
* **linter:** don't pass --color to linters that don't support it ([66354fb6](https://github.com/electron-userland/electron-forge/commit/66354fb6))
* **tests:**
  * use fakeOra properly in system spec ([bb4c7875](https://github.com/electron-userland/electron-forge/commit/bb4c7875))
  * stub ora.warn ([969a0359](https://github.com/electron-userland/electron-forge/commit/969a0359))

#### [4.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.1) (2017-9-5)

##### Bug Fixes

* **generic:** tabtab install script fails on non-*nix systems ([fc3c0301](https://github.com/electron-userland/electron-forge/commit/fc3c0301))

## [4.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v4.0.0) (2017-08-30)

##### Chores

* **publisher:** use SHA256 instead of md5 ([c69db80f](https://github.com/electron-userland/electron-forge/commit/c69db80f))
* **generic:** upgrade Electron Packager to 9.x ([6275d2bf](https://github.com/electron-userland/electron-forge/commit/6275d2bf))

##### Documentation Changes

* **publisher:**
  * improve docs for publish function ([7766a27c](https://github.com/electron-userland/electron-forge/commit/7766a27c))
  * mention that multiple targets are allowed ([3ec0cfa6](https://github.com/electron-userland/electron-forge/commit/3ec0cfa6))
  * fix S3 config key typo ([4225683b](https://github.com/electron-userland/electron-forge/commit/4225683b))
* **maker:** document the return result of make ([5399f500](https://github.com/electron-userland/electron-forge/commit/5399f500))

##### New Features

* **publisher:** adds dryRun and resumeDryRun to the API to allow post-make publishes ([288edbc1](https://github.com/electron-userland/electron-forge/commit/288edbc1))
* **initializer:**
  * only copy CI files if specified ([fd6f2f9b](https://github.com/electron-userland/electron-forge/commit/fd6f2f9b))
  * add Travis/AppVeyor CI files to default template ([296bdde8](https://github.com/electron-userland/electron-forge/commit/296bdde8))

##### Bug Fixes

* **generic:**
  * clean up package manager warning output ([894ed0a9](https://github.com/electron-userland/electron-forge/commit/894ed0a9))
  * add yarn 0.27.5 to the whitelist, but only for darwin/linux ([88b92fce](https://github.com/electron-userland/electron-forge/commit/88b92fce))
  * fix installing tab completion when installing Forge locally ([7ea49812](https://github.com/electron-userland/electron-forge/commit/7ea49812))

##### Refactors

* **publisher:**
  * make dryRun object storage make more sense ([f8d807ed](https://github.com/electron-userland/electron-forge/commit/f8d807ed))
  * rename target option to publishTargets in API ([4b68880d](https://github.com/electron-userland/electron-forge/commit/4b68880d))
* **initializer:** make init options camelcase ([f4459822](https://github.com/electron-userland/electron-forge/commit/f4459822))

##### Tests

* **maker:** Fix make test for new return type ([d6393567](https://github.com/electron-userland/electron-forge/commit/d6393567))
* **publisher:** fix dry run specs ([d2085812](https://github.com/electron-userland/electron-forge/commit/d2085812))

### [3.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v3.2.0) (2017-08-17)

##### Chores

* **generic:**
  * use the xcode8.3 image for Travis OSX ([c24ae48c](https://github.com/electron-userland/electron-forge/commit/c24ae48c))
  * upgrade dependencies ([9d17ca9e](https://github.com/electron-userland/electron-forge/commit/9d17ca9e))
* **tests:** fixup comma arch test ([565fce42](https://github.com/electron-userland/electron-forge/commit/565fce42))

##### Documentation Changes

* **generic:** mention alternate ways of creating new Electron apps with Forge ([419962a8](https://github.com/electron-userland/electron-forge/commit/419962a8))
* **packager:** list the Packager options that are not configurable ([bb33d9b6](https://github.com/electron-userland/electron-forge/commit/bb33d9b6))

##### New Features

* **initializer:** add Forge as a devDependency to new Electron projects ([6d2cf4b0](https://github.com/electron-userland/electron-forge/commit/6d2cf4b0))
* **generic:** print a warning if the package manager used is not a known good version ([a4c36fa4](https://github.com/electron-userland/electron-forge/commit/a4c36fa4))

##### Bug Fixes

* **maker:** allow comma seperated arches in make as well as package ([9c69b08b](https://github.com/electron-userland/electron-forge/commit/9c69b08b))

#### [3.0.5](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.5) (2017-6-17)

##### Bug Fixes

* **maker:** fix debian and redhat maker path calculation ([c2dca211](https://github.com/electron-userland/electron-forge/commit/c2dca211))

#### [3.0.4](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.4) (2017-6-15)

##### Chores

* **tests:** remove unnecessary chai-fetch-mock dependency ([196a64db](https://github.com/electron-userland/electron-forge/commit/196a64db))

##### Bug Fixes

* **maker:** handle name option for the deb, rpm makers as well as dmg ([d335741a](https://github.com/electron-userland/electron-forge/commit/d335741a))
* **generic:** add executable permissions to vscode.cmd ([33532f79](https://github.com/electron-userland/electron-forge/commit/33532f79))

##### Refactors

* **installer:** replace electron-sudo with sudo-prompt ([0ea55fab](https://github.com/electron-userland/electron-forge/commit/0ea55fab))

#### [3.0.3](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.3) (2017-5-26)

##### Bug Fixes

* **initializer:** fix bad logic RE argument parsing from the top level forge command ([774b8769](https://github.com/electron-userland/electron-forge/commit/774b8769))

#### [3.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.2) (2017-5-25)

##### Bug Fixes

* **starter:** fix double dash arg pass through ([0379e5fc](https://github.com/electron-userland/electron-forge/commit/0379e5fc))
* **maker:** fix renaming of DMG output when a custom name is provided ([14cc927a](https://github.com/electron-userland/electron-forge/commit/14cc927a))
* **tests:** fix appx tests (maker did not return output path) ([8d895cfc](https://github.com/electron-userland/electron-forge/commit/8d895cfc))
* **initializer:** fix linting install for airbnb style ([b3446184](https://github.com/electron-userland/electron-forge/commit/b3446184))

##### Refactors

* **generic:** replace fs-promise with fs-extra ([012b152f](https://github.com/electron-userland/electron-forge/commit/012b152f))

##### Tests

* **maker:** add tests for the DMG maker to ensure the renaming logic is correct ([8f5f9691](https://github.com/electron-userland/electron-forge/commit/8f5f9691))

#### [3.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.1) (2017-5-3)

##### Bug Fixes

* **publisher:** fix ers publisher not publishing when version already exists ([1c643ef9](https://github.com/electron-userland/electron-forge/commit/1c643ef9))
* **maker:** fix dmg output path and add test to enforce in future ([a41d6db3](https://github.com/electron-userland/electron-forge/commit/a41d6db3))

## [3.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v3.0.0) (2017-5-1)

##### Chores

* **undefined:** fix devDependency peer dep versions ([c5c8e9a9](https://github.com/electron-userland/electron-forge/commit/c5c8e9a9))
* **generic:** add breaking changes prompt to `npm run commit` ([566fd6fb](https://github.com/electron-userland/electron-forge/commit/566fd6fb))

##### Documentation Changes

* **publisher:** add docs for the new ers publisher ([e70405a8](https://github.com/electron-userland/electron-forge/commit/e70405a8))

##### New Features

* **publisher:** add new publisher for electron-release-server ([0c68ebab](https://github.com/electron-userland/electron-forge/commit/0c68ebab))
* **makers:** Ensure all assets outputted by make are versioned ([6dda5179](https://github.com/electron-userland/electron-forge/commit/6dda5179))
* **maker:**
  * create and consume a common util to check makers' supported platforms ([fa53340b](https://github.com/electron-userland/electron-forge/commit/fa53340b))
  * declare deb maker support for darwin & linux platforms ([f10fbd18](https://github.com/electron-userland/electron-forge/commit/f10fbd18))

##### Bug Fixes

* **start:** exit forge with same status code as Electron if nonzero ([a509f55a](https://github.com/electron-userland/electron-forge/commit/a509f55a))
* **tests:** make optionFetcher-related tests compile again ([1097f8bd](https://github.com/electron-userland/electron-forge/commit/1097f8bd))
* **docs:** rm note that package api's platform opt is ignored ([eefa93f0](https://github.com/electron-userland/electron-forge/commit/eefa93f0))

##### Refactors

* **starter:** use double dash instead of triple dash to pass args through ([e3a1be64](https://github.com/electron-userland/electron-forge/commit/e3a1be64))
* **utils:** filter packages' os declarations to exclude blacklist entries ([fbaec97f](https://github.com/electron-userland/electron-forge/commit/fbaec97f))
* **maker:** support make for targets on non-host platforms ([f79f6f78](https://github.com/electron-userland/electron-forge/commit/f79f6f78))
* **util:** extend requireSearch to export a raw search fn ([84f0134b](https://github.com/electron-userland/electron-forge/commit/84f0134b))

##### Tests

* **publisher:** fix publisher tests for new syntax ([c19d1c2a](https://github.com/electron-userland/electron-forge/commit/c19d1c2a))
* **maker:** add test to confirm dummy maker does not get called ([556deaac](https://github.com/electron-userland/electron-forge/commit/556deaac))

### [2.12.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.12.0) (2017-4-25)

##### New Features

* **maker:** basic hooks for preMake, postMake, generateAssets, prePackage and postPackage ([1a17189b](https://github.com/electron-userland/electron-forge/commit/1a17189b))

##### Bug Fixes

* **maker:** do not enforce the name property on the DMG maker ([1b10fd57](https://github.com/electron-userland/electron-forge/commit/1b10fd57))

#### [2.11.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.11.1) (2017-4-19)

### [2.11.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.11.0) (2017-4-19)

##### New Features

* **maker:** allow maker configs to be functions that return values based on arch ([d9cbec5a](https://github.com/electron-userland/electron-forge/commit/d9cbec5a))

### [2.10.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.10.0) (2017-4-16)

##### Chores

* **generic:**
  * fix/rename coverage sending script ([547c044f](https://github.com/electron-userland/electron-forge/commit/547c044f))
  * update various dependencies ([0f97292c](https://github.com/electron-userland/electron-forge/commit/0f97292c))

##### New Features

* **starter:**
  * windows implementation of the vscode debug command ([9cb7f42c](https://github.com/electron-userland/electron-forge/commit/9cb7f42c))
  * provide an executable to start forge in a vscode debugger compatible way ([1238dee5](https://github.com/electron-userland/electron-forge/commit/1238dee5))

### [2.9.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.9.0) (2017-4-2)

##### Chores

* **generic:** add .editorconfig ([5aaf871e](https://github.com/electron-userland/electron-forge/commit/5aaf871e))

##### New Features

* **importer:** add configurable outDir support for gitignore ([9369284f](https://github.com/electron-userland/electron-forge/commit/9369284f))

##### Bug Fixes

* **initializer:**
  * update Electron version type in .compilerc template, for completeness ([a4fa4bfc](https://github.com/electron-userland/electron-forge/commit/a4fa4bfc))
  * set electron version to be float in init step ([710129b7](https://github.com/electron-userland/electron-forge/commit/710129b7))
* **maker:**
  * upgrade rpm maker for better package.json handling ([926032e8](https://github.com/electron-userland/electron-forge/commit/926032e8))
  * test outDir on zip target only, after other targets run ([a2c92499](https://github.com/electron-userland/electron-forge/commit/a2c92499))
  * pass computed outDir to packager ([686200f6](https://github.com/electron-userland/electron-forge/commit/686200f6))
  * search local node_modules folder for maker when installed globally ([9b8f2970](https://github.com/electron-userland/electron-forge/commit/9b8f2970))
* **tests:**
  * stop awaiting mocha and ensure we clean up out dirs ([2e6dc384](https://github.com/electron-userland/electron-forge/commit/2e6dc384))
  * use expect(await ...) syntax per @marshallofsound ([59ddf9af](https://github.com/electron-userland/electron-forge/commit/59ddf9af))
* **generic:** use path.resolve (vs /-delimited) to compute default outDir ([ff167447](https://github.com/electron-userland/electron-forge/commit/ff167447))
* **packager:** correct main file reference in thrown error from packageJson.name to .main ([a68284b1](https://github.com/electron-userland/electron-forge/commit/a68284b1))
* **publisher:** check local node_modules when searching for publisher ([42fad7f3](https://github.com/electron-userland/electron-forge/commit/42fad7f3))

##### Refactors

* **maker:** compute outDir from providedOptions w/default ([d69e7626](https://github.com/electron-userland/electron-forge/commit/d69e7626))
* **packager:** compute outDir from providedOptions w/default ([1e26d258](https://github.com/electron-userland/electron-forge/commit/1e26d258))

##### Code Style Changes

* **initializer:** fix typo ([dd6aec48](https://github.com/electron-userland/electron-forge/commit/dd6aec48))

##### Tests

* **tests:** add tests for packager & maker outDir support ([32cecffd](https://github.com/electron-userland/electron-forge/commit/32cecffd))

#### [2.8.3](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.3) (2017-3-10)

##### Chores

* **generic:**
  * update react-typescript template ([30516e78](https://github.com/electron-userland/electron-forge/commit/30516e78))
  * make release script work on windows ([0ff6a7ab](https://github.com/electron-userland/electron-forge/commit/0ff6a7ab))

##### New Features

* **starter:** automatically wipe the ELECTRON_RUN_AS_NODE variable unless specified ([c702fe4a](https://github.com/electron-userland/electron-forge/commit/c702fe4a))
* **generic:**
  * Support setting the Electron app path in start() ([47c5572e](https://github.com/electron-userland/electron-forge/commit/47c5572e))
  * allow third party modules to be named whatever they want ([fddb40e6](https://github.com/electron-userland/electron-forge/commit/fddb40e6))

##### Bug Fixes

* **publisher:** use updated node-github response API ([0f8e6c4f](https://github.com/electron-userland/electron-forge/commit/0f8e6c4f))
* **maker:**
  * fix the squirrel maker app name logic ([84031ecb](https://github.com/electron-userland/electron-forge/commit/84031ecb))
  * allow most appx default config to be overridden by the user ([b1e90538](https://github.com/electron-userland/electron-forge/commit/b1e90538))
* **tests:** ensure test project has proper metadata filled ([0bc81858](https://github.com/electron-userland/electron-forge/commit/0bc81858))

#### [2.8.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.2) (2017-2-28)

##### Chores

* **templates:** bump all template versions ([32297344](https://github.com/electron-userland/electron-forge/commit/32297344))

##### Bug Fixes

* **ci:** Use the preinstalled yarn on AppVeyor (#146) ([7a1deee7](https://github.com/electron-userland/electron-forge/commit/7a1deee7))
* **publisher:** Fix secret access key ([0a9710b5](https://github.com/electron-userland/electron-forge/commit/0a9710b5))

#### [2.8.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.1) (2017-2-23)

##### Chores

* **generic:**
  * add checkboxes and intros to the issue/PR templates ([a1ab1c3a](https://github.com/electron-userland/electron-forge/commit/a1ab1c3a))
  * fix formatting in GitHub issue template ([da95b42b](https://github.com/electron-userland/electron-forge/commit/da95b42b))
* **tests:** remove now obsolete flatpak call in Linux tests ([b93b6cfe](https://github.com/electron-userland/electron-forge/commit/b93b6cfe))

##### Documentation Changes

* **publisher:**
  * mention the standard AWS environment variables in the README ([efc7ea14](https://github.com/electron-userland/electron-forge/commit/efc7ea14))
  * add example for GitHub publish target ([3fc0a9c2](https://github.com/electron-userland/electron-forge/commit/3fc0a9c2))

##### New Features

* **packager:** remove the users forge config after packaging for safety reasons ([7432e034](https://github.com/electron-userland/electron-forge/commit/7432e034))
* **publisher:**
  * allow usage of standard AWS environment variables for S3 publishing ([d31ce248](https://github.com/electron-userland/electron-forge/commit/d31ce248))
  * add S3 publish target ([fa31902a](https://github.com/electron-userland/electron-forge/commit/fa31902a))
  * allow platform level config for publish targets ([8572cad6](https://github.com/electron-userland/electron-forge/commit/8572cad6))
* **generic:** allow config options to be automagically pulled in from process.env ([250c197f](https://github.com/electron-userland/electron-forge/commit/250c197f))

##### Bug Fixes

* **tests:**
  * fix forge config deletion tests on all platforms ([7b99e847](https://github.com/electron-userland/electron-forge/commit/7b99e847))
  * fix test failures caused by config structure changes ([3a3cdfdb](https://github.com/electron-userland/electron-forge/commit/3a3cdfdb))
* **importer:**
  * install electron-prebuilt-compile as devDep ([e80be32a](https://github.com/electron-userland/electron-forge/commit/e80be32a))
  * check updateScripts value at script install vs deps removal ([4942cb60](https://github.com/electron-userland/electron-forge/commit/4942cb60))
  * ensure electronName exists before resolving its path ([9dcf2ec5](https://github.com/electron-userland/electron-forge/commit/9dcf2ec5))
* **publisher:** throw an exception if a GitHub token isn't specified ([bc299b7a](https://github.com/electron-userland/electron-forge/commit/bc299b7a))
* **initializer:** add github_repository.name to package.json in default template ([d1ceadf3](https://github.com/electron-userland/electron-forge/commit/d1ceadf3))

##### Refactors

* **publisher:** add deprecate method call to inform the user ([24571197](https://github.com/electron-userland/electron-forge/commit/24571197))

##### Code Style Changes

* **util:** fix typo re: imagePath ([9e064cf3](https://github.com/electron-userland/electron-forge/commit/9e064cf3))

### [2.8.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.8.0) (2017-2-2)

##### Chores

* **gitignore:** ignore npm-debug.log files ([06b824ee](https://github.com/electron-userland/electron-forge/commit/06b824ee))

##### New Features

* **importer:** allow the implementer to decide whether to override scripts or not ([f85e194f](https://github.com/electron-userland/electron-forge/commit/f85e194f))
* **starter:** resolve start api usage with a handle to the spawned process ([b5ba30e3](https://github.com/electron-userland/electron-forge/commit/b5ba30e3))

##### Bug Fixes

* **importer:** if no electron was found install the latest version by default ([c8b12fbf](https://github.com/electron-userland/electron-forge/commit/c8b12fbf))
* **generic:** make all process.exit and console calls respect the interactive setting ([a3e43315](https://github.com/electron-userland/electron-forge/commit/a3e43315))

##### Refactors

* **generic:** add wrappers for console.info and console.warn ([f223df85](https://github.com/electron-userland/electron-forge/commit/f223df85))

##### Tests

* **starter:** add test for returned childProcess.spawn ([f2c128e4](https://github.com/electron-userland/electron-forge/commit/f2c128e4))

#### [2.7.5](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.5) (2017-1-29)

##### Chores

* **tests:** add eslint-plugin-mocha ([74397232](https://github.com/electron-userland/electron-forge/commit/74397232))
* **generic:** update electron-installer-dmg to version 0.2.0 ([aa8034b1](https://github.com/electron-userland/electron-forge/commit/aa8034b1))

##### Bug Fixes

* **tests:** update tests due to changes in #101 ([912b4f69](https://github.com/electron-userland/electron-forge/commit/912b4f69))
* **maker:** detect out path of package step correctly ([6d15c62d](https://github.com/electron-userland/electron-forge/commit/6d15c62d))
* **tabtab:** dont install tabtab in a development environment and ignore tabtab install errors ([f0cb0417](https://github.com/electron-userland/electron-forge/commit/f0cb0417))

##### Code Style Changes

* **generic:** fixed typos ([2f869d81](https://github.com/electron-userland/electron-forge/commit/2f869d81))
* **tests:** ignore intentionally wrong code in test ([f01f9907](https://github.com/electron-userland/electron-forge/commit/f01f9907))

##### Tests

* **initializer:** add nonexistent template test ([6f26c64f](https://github.com/electron-userland/electron-forge/commit/6f26c64f))
* **generic:** increase test coverage of the init API ([2c9caddf](https://github.com/electron-userland/electron-forge/commit/2c9caddf))
* **starter:** add test coverage for starter ([0d2f5712](https://github.com/electron-userland/electron-forge/commit/0d2f5712))
* **installer:** add test coverage for the installer ([4049e31c](https://github.com/electron-userland/electron-forge/commit/4049e31c))
* **tests:** increase test coverage on util modules ([6c63aafa](https://github.com/electron-userland/electron-forge/commit/6c63aafa))

#### [2.7.4](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.4) (2017-1-27)

##### Documentation Changes

* **generic:** clarify what the major package dependencies are ([559956b3](https://github.com/electron-userland/electron-forge/commit/559956b3))

##### Refactors

* **generic:** move ora.ora to an ora helper for ease of submodule use ([ee33638a](https://github.com/electron-userland/electron-forge/commit/ee33638a))

#### [2.7.3](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.3) (2017-1-25)

##### New Features

* **installer:** manually mount and scan a DMG file when installing for the .app ([7ea5af8a](https://github.com/electron-userland/electron-forge/commit/7ea5af8a))

##### Bug Fixes

* **packager:** fix resolving of afterCopy and afterExtract hook paths ([bd4df685](https://github.com/electron-userland/electron-forge/commit/bd4df685))
* **installer:** fix install prompt when multiple compatable targets found ([9a2f36c9](https://github.com/electron-userland/electron-forge/commit/9a2f36c9))

##### Code Style Changes

* **generic:** remove unnecessary eslint pragmas ([23d1aa9f](https://github.com/electron-userland/electron-forge/commit/23d1aa9f))

#### [2.7.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.2) (2017-1-18)

##### Bug Fixes

* **packager:** force upgrade to electron-rebuild 1.5.7 ([f2912db5](https://github.com/electron-userland/electron-forge/commit/f2912db5))

#### [2.7.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.1) (2017-1-15)

##### Chores

* **generic:**
  * alphabetize custom eslint rules ([e7f6eeb6](https://github.com/electron-userland/electron-forge/commit/e7f6eeb6))
  * disable the no-throw-literal eslint rule ([05f893e8](https://github.com/electron-userland/electron-forge/commit/05f893e8))

##### Bug Fixes

* **initializer:** handle local templates correctly ([42bf745a](https://github.com/electron-userland/electron-forge/commit/42bf745a))
* **alias:** fix the forge alias so that it can run the make command ([725e6b06](https://github.com/electron-userland/electron-forge/commit/725e6b06))

### [2.7.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.7.0) (2017-1-14)

##### Documentation Changes

* **initializer:** document the built in templates ([b0eec7c3](https://github.com/electron-userland/electron-forge/commit/b0eec7c3))

##### New Features

* **initializer:** add userland templates to forge ([bcba06a2](https://github.com/electron-userland/electron-forge/commit/bcba06a2))

### [2.6.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.6.0) (2017-1-10)

##### Chores

* **deps:** Update electron-windows-store ([761464f0](https://github.com/electron-userland/electron-forge/commit/761464f0))

##### New Features

* **importer:**
  * ensure the user is aware of any script changes we make ([cbb73e7e](https://github.com/electron-userland/electron-forge/commit/cbb73e7e))
  * import now sets the scripts section in package.json to be forge scripts ([cb01d406](https://github.com/electron-userland/electron-forge/commit/cb01d406))
* **initializer:** template package.json now includes package and make scripts ([272d9b1e](https://github.com/electron-userland/electron-forge/commit/272d9b1e))
* **rebuilder:** show rebuild progress from the electron-rebuild lifecycle ([26f23b48](https://github.com/electron-userland/electron-forge/commit/26f23b48))
* **generic:**
  * use electron-rebuild instead of generic rebuild logic ([3d26da5b](https://github.com/electron-userland/electron-forge/commit/3d26da5b))
  * add basic tab completion for top level commands ([30082bbf](https://github.com/electron-userland/electron-forge/commit/30082bbf))

##### Bug Fixes

* **packager:**
  * check asar.unpack correctly ([150ea5dd](https://github.com/electron-userland/electron-forge/commit/150ea5dd))
  * clarify entry point error messages ([969ab1ea](https://github.com/electron-userland/electron-forge/commit/969ab1ea))
  * throw errors on an uncompilable entrypoint ([b7f7b81c](https://github.com/electron-userland/electron-forge/commit/b7f7b81c))
* **initializer:**
  * unpin electron-compilers ([9e2aefaa](https://github.com/electron-userland/electron-forge/commit/9e2aefaa))
  * unpin eslint-plugin-jsx-a11y ([02b6e367](https://github.com/electron-userland/electron-forge/commit/02b6e367))
  * pin electron-compilers dependency due to typescript bug ([4ebafa8d](https://github.com/electron-userland/electron-forge/commit/4ebafa8d))

##### Refactors

* **packager:** upgrade to Electron Packager 8.5.0 ([b8489b47](https://github.com/electron-userland/electron-forge/commit/b8489b47))

#### [2.5.2](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.2) (2017-1-7)

##### Bug Fixes

* **publisher:** dont call make twice while publishing ([55bfe1ac](https://github.com/electron-userland/electron-forge/commit/55bfe1ac))

#### [2.5.1](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.1) (2017-1-5)

##### Chores

* **undefined:**
  * istanbul-lib-instrument is no longer required ([f60dd586](https://github.com/electron-userland/electron-forge/commit/f60dd586))
  * upgrade to version of babel-plugin-istanbul that should address regression ([0913506b](https://github.com/electron-userland/electron-forge/commit/0913506b))

##### Bug Fixes

* **importer:** fix relative path to tmpl directory ([b39c1008](https://github.com/electron-userland/electron-forge/commit/b39c1008))
* **undefined:** regression in istanbul-lib-instrument and babel-plugin-istanbul should now be addressed ([58b9791e](https://github.com/electron-userland/electron-forge/commit/58b9791e))

### [2.5.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.5.0) (2017-1-3)

##### Chores

* **generic:**
  * only publish CI coverage on success ([7fbbef72](https://github.com/electron-userland/electron-forge/commit/7fbbef72))
  * enable coveralls ([2f821155](https://github.com/electron-userland/electron-forge/commit/2f821155))
* **tests:**
  * fix appx tests on rebased branch ([75f217a5](https://github.com/electron-userland/electron-forge/commit/75f217a5))
  * move tests to be unit tests on the API and enable coverage ([54603c1e](https://github.com/electron-userland/electron-forge/commit/54603c1e))

##### Documentation Changes

* **generic:**
  * fix option variable names ([0923ac1e](https://github.com/electron-userland/electron-forge/commit/0923ac1e))
  * cleanup API docs ([9c118a4f](https://github.com/electron-userland/electron-forge/commit/9c118a4f))
  * add doc formatting guidelines based off of pycodestyle ([6efa5259](https://github.com/electron-userland/electron-forge/commit/6efa5259))
* **importer:**
  * tweak description ([e885cd5e](https://github.com/electron-userland/electron-forge/commit/e885cd5e))
  * mention import in the README ([d5eab37a](https://github.com/electron-userland/electron-forge/commit/d5eab37a))

##### New Features

* **generic:**
  * expose some util methods through JS API ([a506dd33](https://github.com/electron-userland/electron-forge/commit/a506dd33))
  * expose top level methods as JS APIs ([93fb48f5](https://github.com/electron-userland/electron-forge/commit/93fb48f5))
* **publisher:** add draft and prerelease options for publishing to github ([898de235](https://github.com/electron-userland/electron-forge/commit/898de235))

##### Bug Fixes

* **generic:** lock istanbul dependency versions to prevent bug ([205104c4](https://github.com/electron-userland/electron-forge/commit/205104c4))

##### Refactors

* **generic:** refactor confirm prompts into a helper for interactive mode ([b495012e](https://github.com/electron-userland/electron-forge/commit/b495012e))

##### Tests

* **generic:** add tests for lots of the utils ([d0962b93](https://github.com/electron-userland/electron-forge/commit/d0962b93))

### [2.4.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.4.0) (2017-1-3)

##### New Features

* **maker:** add support for Windows Store (AppX) packages ([74a12163](https://github.com/electron-userland/electron-forge/commit/74a12163))
* **starter:** switch the default Babel preset to use babel-preset-env ([4e3bb17b](https://github.com/electron-userland/electron-forge/commit/4e3bb17b))

##### Bug Fixes

* **starter:** ensure linebreak-style is disabled ([ac7a20bc](https://github.com/electron-userland/electron-forge/commit/ac7a20bc))

### [2.3.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.3.0) (2017-1-1)

##### Chores

* **installer:** use the ora helper in the install command ([9358eb42](https://github.com/electron-userland/electron-forge/commit/9358eb42))
* **generic:**
  * add installer to cz config ([3b253b11](https://github.com/electron-userland/electron-forge/commit/3b253b11))
  * only send slack notifications on build change ([838d70e7](https://github.com/electron-userland/electron-forge/commit/838d70e7))
* **tests:** make sure ora knows that the Docker container is for CI ([41d25ea7](https://github.com/electron-userland/electron-forge/commit/41d25ea7))

##### New Features

* **installer:**
  * add rpm installer ([f8f9baa5](https://github.com/electron-userland/electron-forge/commit/f8f9baa5))
  * don't suffix temp install files with .forge-install ([1c2bfd81](https://github.com/electron-userland/electron-forge/commit/1c2bfd81))
  * add deb installer ([fb217c74](https://github.com/electron-userland/electron-forge/commit/fb217c74))
  * add DMG support for macOS installer ([3465d261](https://github.com/electron-userland/electron-forge/commit/3465d261))
  * add inital app installer for macOS platform ([da3150d9](https://github.com/electron-userland/electron-forge/commit/da3150d9))
* **generic:**
  * use an ora/promise helper instead of a global uncaughtRejection handler (#50) ([1b6b7276](https://github.com/electron-userland/electron-forge/commit/1b6b7276))
  * travis build notifications ([d25f1461](https://github.com/electron-userland/electron-forge/commit/d25f1461))

##### Bug Fixes

* **installer:**
  * fix installer debug key ([24454950](https://github.com/electron-userland/electron-forge/commit/24454950))
  * dont fetch prerelease versions unless instructed ([1b88b153](https://github.com/electron-userland/electron-forge/commit/1b88b153))
  * await promises through the linux install chain ([a0b5ac70](https://github.com/electron-userland/electron-forge/commit/a0b5ac70))
  * remove flatpak check ([0b044134](https://github.com/electron-userland/electron-forge/commit/0b044134))
  * wildcard the extension matchers ([1489e641](https://github.com/electron-userland/electron-forge/commit/1489e641))

##### Refactors

* **installer:**
  * use single regexp to make repo path safe ([1255803b](https://github.com/electron-userland/electron-forge/commit/1255803b))
  * finish replacing sudo-prompt with electron-sudo ([d8587930](https://github.com/electron-userland/electron-forge/commit/d8587930))
  * replace sudo-prompt with git branch of electron-sudo for Linux installers ([9834cb1b](https://github.com/electron-userland/electron-forge/commit/9834cb1b))
  * check that the linux installer program exists first ([fb56c542](https://github.com/electron-userland/electron-forge/commit/fb56c542))
  * update the ora text wh have resolved a repo but not found a release ([5cbf8cb8](https://github.com/electron-userland/electron-forge/commit/5cbf8cb8))

### [2.2.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.2.0) (2016-12-30)

##### New Features

* **initializer:** allow custom initialzers ([9e6ddfa0](https://github.com/electron-userland/electron-forge/commit/9e6ddfa0))

##### Tests

* **initializer:** add test for custom initializer ([0dc62307](https://github.com/electron-userland/electron-forge/commit/0dc62307))

### [2.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.1.0) (2016-12-30)

##### Chores

* **generic:** add importer to the git-cz list ([fbf691cb](https://github.com/electron-userland/electron-forge/commit/fbf691cb))
* **tests:** remove .only from util_spec ([3b01f08c](https://github.com/electron-userland/electron-forge/commit/3b01f08c))

##### New Features

* **importer:**
  * confirm build tool package removal from user ([3b548557](https://github.com/electron-userland/electron-forge/commit/3b548557))
  * delete existing Electron build tools from package.json ([4152bd2d](https://github.com/electron-userland/electron-forge/commit/4152bd2d))
  * move babel config in existing project to .compilerc ([b09fc3d6](https://github.com/electron-userland/electron-forge/commit/b09fc3d6))
  * fix the projects gitignore on import ([75366bfe](https://github.com/electron-userland/electron-forge/commit/75366bfe))
  * create inital import logic ([bddb9038](https://github.com/electron-userland/electron-forge/commit/bddb9038))
* **maker:** allow user to override make targets ([bac86800](https://github.com/electron-userland/electron-forge/commit/bac86800))
* **generic:** allow config options to use string templating ([5a568cb8](https://github.com/electron-userland/electron-forge/commit/5a568cb8))

##### Bug Fixes

* **importer:**
  * pretty print the compilerc file ([07f06b40](https://github.com/electron-userland/electron-forge/commit/07f06b40))
  * update the logging as per PR feedback ([dac33f0d](https://github.com/electron-userland/electron-forge/commit/dac33f0d))
* **rebuild:** skip dependencies without a package.json file ([3348223d](https://github.com/electron-userland/electron-forge/commit/3348223d))
* **packager:** remove stray .bin files leftover by yarn installs during packaging ([50ad8e6d](https://github.com/electron-userland/electron-forge/commit/50ad8e6d))

##### Refactors

* **importer:**
  * use readPackageJSON ([e000eaf1](https://github.com/electron-userland/electron-forge/commit/e000eaf1))
  * de-rimrafify ([df4193a4](https://github.com/electron-userland/electron-forge/commit/df4193a4))

## [2.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v2.0.0) (2016-12-30)

##### Chores

* **generic:** add publisher to cz config ([8653b62b](https://github.com/electron-userland/electron-forge/commit/8653b62b))

##### Documentation Changes

* **publisher:** document the API for custom makers and publishers ([81ed28d7](https://github.com/electron-userland/electron-forge/commit/81ed28d7))

##### New Features

* **publisher:** initial work on a publish command to sent make artifacts to github ([189cb0cc](https://github.com/electron-userland/electron-forge/commit/189cb0cc))
* **generic:** map the alias bin commands to the correct commander files ([f1cac740](https://github.com/electron-userland/electron-forge/commit/f1cac740))

##### Bug Fixes

* **publisher:**
  * publish to the correct version ([02fe5699](https://github.com/electron-userland/electron-forge/commit/02fe5699))
  * throw custom 404 if we cant find the release ([6f4e1ed4](https://github.com/electron-userland/electron-forge/commit/6f4e1ed4))
* **maker:** fix RPM maker outPath variable ([4b32fe42](https://github.com/electron-userland/electron-forge/commit/4b32fe42))

##### Refactors

* **publisher:** move github publish logic to own file ([bdaff3ce](https://github.com/electron-userland/electron-forge/commit/bdaff3ce))

##### Tests

* **generic:** add tests for the require-search util ([b7930eaa](https://github.com/electron-userland/electron-forge/commit/b7930eaa))

### [1.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v1.1.0) (2016-12-27)

##### Chores

* **tests:** run flatpak runtime install in local Dockerfile ([d046965f](https://github.com/electron-userland/electron-forge/commit/d046965f))
* **generic:** add pretest step to improve development ([558fae31](https://github.com/electron-userland/electron-forge/commit/558fae31))
* **packages:** upgrade fs-promise and inquirer (#18) ([d51d482f](https://github.com/electron-userland/electron-forge/commit/d51d482f))

##### Documentation Changes

* **generic:** document the new JS file option for config ([2d44c41f](https://github.com/electron-userland/electron-forge/commit/2d44c41f))

##### New Features

* **rebuilder:** only rebuild prod and optional deps (ignore dev deps) ([d751a85f](https://github.com/electron-userland/electron-forge/commit/d751a85f))
* **generic:** allow JS files to provide the config object ([e57f3c78](https://github.com/electron-userland/electron-forge/commit/e57f3c78))

##### Bug Fixes

* **packager:** allow hooks to be strings or functions depending on config setup ([ec0caecc](https://github.com/electron-userland/electron-forge/commit/ec0caecc))
* **rebuilder:** rebuild modules inside @ scoped folders as well (#19) ([bc21528d](https://github.com/electron-userland/electron-forge/commit/bc21528d))
* **generic:** document that the minimum Node version is 6 ([1f5ac7f2](https://github.com/electron-userland/electron-forge/commit/1f5ac7f2))

##### Refactors

* **generic:**
  * standardize reading package.json files (#33) ([0855eacf](https://github.com/electron-userland/electron-forge/commit/0855eacf))
  * replace mkdirp/rimraf calls with equivalent fs-promise calls ([bb2c6cf3](https://github.com/electron-userland/electron-forge/commit/bb2c6cf3))
* **tests:** use different native modules so the tests run on CI ([d20387b7](https://github.com/electron-userland/electron-forge/commit/d20387b7))

##### Tests

* **generic:** only skip help spec on Windows (#34) ([202987e1](https://github.com/electron-userland/electron-forge/commit/202987e1))
* **builder:** add tests to ensure correct behvior of the native module builder ([b79c7af5](https://github.com/electron-userland/electron-forge/commit/b79c7af5))

#### [1.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v1.0.1) (2016-12-12)

##### Chores

* **tests:** add AppVeyor support (#15) ([fe63ac0b](https://github.com/electron-userland/electron-forge/commit/fe63ac0b))

##### Bug Fixes

* **starter:** fix launching on newest yarn ([8c5bc656](https://github.com/electron-userland/electron-forge/commit/8c5bc656))

## [1.0.0](https://github.com/electron-userland/electron-forge/releases/tag/v1.0.0) (2016-12-11)

##### Chores

* **generic:**
  * rename all instances of marshallofsound to electron-userland ([9981fcbb](https://github.com/electron-userland/electron-forge/commit/9981fcbb))
  * fix changelog link parsing ([07defb76](https://github.com/electron-userland/electron-forge/commit/07defb76))
* **packager:** remove commented code ([35745594](https://github.com/electron-userland/electron-forge/commit/35745594))
* **maker:** add mas default targets ([775459cd](https://github.com/electron-userland/electron-forge/commit/775459cd))

##### New Features

* **maker:**
  * enable MAS makes on darwin platform ([d8ac9ad8](https://github.com/electron-userland/electron-forge/commit/d8ac9ad8))
  * allow make to target different or multiple arches ([3d4ee593](https://github.com/electron-userland/electron-forge/commit/3d4ee593))

##### Bug Fixes

* **maker:** build armv7l distributables when arch=all ([f6d28c32](https://github.com/electron-userland/electron-forge/commit/f6d28c32))
* **packager:**
  * change arch name when armv7l is packaged during arch=all ([132b3670](https://github.com/electron-userland/electron-forge/commit/132b3670))
  * fix the third arch ora on linux ([894fd4e7](https://github.com/electron-userland/electron-forge/commit/894fd4e7))
  * fix ora sequencing when running with --arch=all ([e4dfdede](https://github.com/electron-userland/electron-forge/commit/e4dfdede))

##### Refactors

* **generic:** replace process.arch with a function that handles arm arches better ([81fa0943](https://github.com/electron-userland/electron-forge/commit/81fa0943))

### [0.1.0](https://github.com/electron-userland/electron-forge/releases/tag/v0.1.0) (2016-12-11)

##### Chores

* **tests:**
  * install g++ since Docker Hub won't create a new image ([f219e994](https://github.com/electron-userland/electron-forge/commit/f219e994))
  * disable building branches on Travis CI ([12e5d99e](https://github.com/electron-userland/electron-forge/commit/12e5d99e))
* **initializer:** output logs of the install step on failure ([20c0b12a](https://github.com/electron-userland/electron-forge/commit/20c0b12a))
* **generic:**
  * make the changelog link to the relevent commits ([ee6a7d86](https://github.com/electron-userland/electron-forge/commit/ee6a7d86))
  * set up changelog generation ([9a3854f1](https://github.com/electron-userland/electron-forge/commit/9a3854f1))

##### Documentation Changes

* **generic:**
  * add contributing/issue/pull request docs + news ([d25d701d](https://github.com/electron-userland/electron-forge/commit/d25d701d))
  * clean up README ([eddd61d8](https://github.com/electron-userland/electron-forge/commit/eddd61d8))
* **packager:** fix syntax of hook docs ([84a1a063](https://github.com/electron-userland/electron-forge/commit/84a1a063))

##### New Features

* **packager:** rebuild native modules automatically in all the right places ([1d1ff74d](https://github.com/electron-userland/electron-forge/commit/1d1ff74d))

##### Bug Fixes

* **packager:**
  * output rebuild errors if there are any ([f8ffca13](https://github.com/electron-userland/electron-forge/commit/f8ffca13))
  * rebuild pre-gyp modules with their binary variables ([ed9137dd](https://github.com/electron-userland/electron-forge/commit/ed9137dd))

##### Refactors

* **packager:** make the rebuild a promise and use an ora ([bc1ec28d](https://github.com/electron-userland/electron-forge/commit/bc1ec28d))

#### [0.0.9](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.9) (2016-12-11)

##### Documentation Changes

* **packager:** document the require mapping of the hooks ([87fb6aa6](https://github.com/electron-userland/electron-forge/commit/87fb6aa6))

##### New Features

* **packager:** map afterExtract hooks to require calls ([623a0001](https://github.com/electron-userland/electron-forge/commit/623a0001))

#### [0.0.8](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.8) (2016-12-11)

##### New Features

* **maker:** add the flatpak maker for the linux target ([218518ef](https://github.com/electron-userland/electron-forge/commit/218518ef))

##### Refactors

* **packager:**
  * move packager compile logic to a electron-packager afterCopy hook ([c10bcd29](https://github.com/electron-userland/electron-forge/commit/c10bcd29))
  * upgrade to Electron Packager 8.4.0 (with quiet option) ([9ab19b5f](https://github.com/electron-userland/electron-forge/commit/9ab19b5f))

#### [0.0.7](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.7) (2016-12-11)

##### Documentation Changes

* **generic:**
  * tweak the readme ([c6ededf6](https://github.com/electron-userland/electron-forge/commit/c6ededf6))
  * update readme ([f03ffeb5](https://github.com/electron-userland/electron-forge/commit/f03ffeb5))

##### Bug Fixes

* **starter:** pass through env to started application ([834729fb](https://github.com/electron-userland/electron-forge/commit/834729fb))
* **maker:** spawn the zip command in the containing directory ([e909a0c4](https://github.com/electron-userland/electron-forge/commit/e909a0c4))
* **initializer:** add electron-compile to the prod dependencies of the initialized app ([5a56efb9](https://github.com/electron-userland/electron-forge/commit/5a56efb9))

#### [0.0.6](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.6) (2016-12-11)

##### Chores

* **tests:**
  * run different package installers in different Travis workers ([028bcfbf](https://github.com/electron-userland/electron-forge/commit/028bcfbf))
  * run Travis with OSX and Linux workers ([9d1b0291](https://github.com/electron-userland/electron-forge/commit/9d1b0291))

##### Documentation Changes

* **README:**
  * fix license badge url ([026141c0](https://github.com/electron-userland/electron-forge/commit/026141c0))
  * add badges to the readme ([f912c24f](https://github.com/electron-userland/electron-forge/commit/f912c24f))
* **LICENSE:** add a license file ([89ada6e9](https://github.com/electron-userland/electron-forge/commit/89ada6e9))

##### New Features

* **maker:**
  * add the rpm maker for the linux target ([85821f27](https://github.com/electron-userland/electron-forge/commit/85821f27))
  * add the deb maker for the linux target ([5c5ce67a](https://github.com/electron-userland/electron-forge/commit/5c5ce67a))
  * add the dmg maker for the darwin target ([aaceb3f2](https://github.com/electron-userland/electron-forge/commit/aaceb3f2))
* **build:** add git-cz for semantic versioned commits ([cdbc78b6](https://github.com/electron-userland/electron-forge/commit/cdbc78b6))

##### Bug Fixes

* **maker:**
  * add a santizied app id to the electronWinstaller config on init ([20ae889e](https://github.com/electron-userland/electron-forge/commit/20ae889e))
  * move electron-installer-debian to optional deps so that installs work on windows ([661b1eb6](https://github.com/electron-userland/electron-forge/commit/661b1eb6))
  * correct path/arch of generated deb file ([63ff52b2](https://github.com/electron-userland/electron-forge/commit/63ff52b2))
* **generic:** fix package.json warning about repository ([f21a87aa](https://github.com/electron-userland/electron-forge/commit/f21a87aa))
* **packager:** throw error when electron-prebuilt-compile is not found ([23449956](https://github.com/electron-userland/electron-forge/commit/23449956))

##### Refactors

* **maker:**
  * DRY up app name ([f5ae494f](https://github.com/electron-userland/electron-forge/commit/f5ae494f))
  * add packageJSON to the function arguments ([e8e1054a](https://github.com/electron-userland/electron-forge/commit/e8e1054a))
  * create ensure{Directory,File} to rimraf+mkdirp the given output ([b3b616a0](https://github.com/electron-userland/electron-forge/commit/b3b616a0))
* **generic:**
  * add debug calls to the linter ([3e116109](https://github.com/electron-userland/electron-forge/commit/3e116109))
  * add the 'debug' module for standard debug logging ([9f4c0b49](https://github.com/electron-userland/electron-forge/commit/9f4c0b49))
* **packager:**
  * remove stray log ([f4f36b59](https://github.com/electron-userland/electron-forge/commit/f4f36b59))
  * move the electron-packager dependency to forge instead of the users module ([2e695c21](https://github.com/electron-userland/electron-forge/commit/2e695c21))

##### Code Style Changes

* **generic:**
  * disable some eslint rules that don't make sense in a CLI tool ([f1f06acf](https://github.com/electron-userland/electron-forge/commit/f1f06acf))
  * change eslint rules to allow strange linebreaks ([4b7a22e3](https://github.com/electron-userland/electron-forge/commit/4b7a22e3))

##### Tests

* **resolve-dir:** add a fixture that is actually an electron-forge package.json file ([e0e712dd](https://github.com/electron-userland/electron-forge/commit/e0e712dd))

#### [0.0.5](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.5) (2016-12-11)

#### [0.0.4](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.4) (2016-12-11)

#### [0.0.3](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.3) (2016-12-11)

#### [0.0.2](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.2) (2016-12-11)

#### [0.0.1](https://github.com/electron-userland/electron-forge/releases/tag/v0.0.1) (2016-12-11)
