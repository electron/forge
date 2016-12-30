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
