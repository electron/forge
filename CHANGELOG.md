#### 0.0.9 (2016-12-11)

##### Documentation Changes

* **packager:** document the require mapping of the hooks (87fb6aa6)

##### New Features

* **packager:** map afterExtract hooks to require calls (623a0001)

#### 0.0.8 (2016-12-11)

##### New Features

* **maker:** add the flatpak maker for the linux target (218518ef)

##### Refactors

* **packager:**
  * move packager compile logic to a electron-packager afterCopy hook (c10bcd29)
  * upgrade to Electron Packager 8.4.0 (with quiet option) (9ab19b5f)

#### 0.0.7 (2016-12-11)

##### Documentation Changes

* **generic:**
  * tweak the readme (c6ededf6)
  * update readme (f03ffeb5)

##### Bug Fixes

* **starter:** pass through env to started application (834729fb)
* **maker:** spawn the zip command in the containing directory (e909a0c4)
* **initializer:** add electron-compile to the prod dependencies of the initialized app (5a56efb9)

#### 0.0.6 (2016-12-11)

##### Chores

* **tests:**
  * run different package installers in different Travis workers (028bcfbf)
  * run Travis with OSX and Linux workers (9d1b0291)

##### Documentation Changes

* **README:**
  * fix license badge url (026141c0)
  * add badges to the readme (f912c24f)
* **LICENSE:** add a license file (89ada6e9)

##### New Features

* **maker:**
  * add the rpm maker for the linux target (85821f27)
  * add the deb maker for the linux target (5c5ce67a)
  * add the dmg maker for the darwin target (aaceb3f2)
* **build:** add git-cz for semantic versioned commits (cdbc78b6)

##### Bug Fixes

* **maker:**
  * add a santizied app id to the electronWinstaller config on init (20ae889e)
  * move electron-installer-debian to optional deps so that installs work on windows (661b1eb6)
  * correct path/arch of generated deb file (63ff52b2)
* **generic:** fix package.json warning about repository (f21a87aa)
* **packager:** throw error when electron-prebuilt-compile is not found (23449956)

##### Refactors

* **maker:**
  * DRY up app name (f5ae494f)
  * add packageJSON to the function arguments (e8e1054a)
  * create ensure{Directory,File} to rimraf+mkdirp the given output (b3b616a0)
* **generic:**
  * add debug calls to the linter (3e116109)
  * add the 'debug' module for standard debug logging (9f4c0b49)
* **packager:**
  * remove stray log (f4f36b59)
  * move the electron-packager dependency to forge instead of the users module (2e695c21)

##### Code Style Changes

* **generic:**
  * disable some eslint rules that don't make sense in a CLI tool (f1f06acf)
  * change eslint rules to allow strange linebreaks (4b7a22e3)

##### Tests

* **resolve-dir:** add a fixture that is actually an electron-forge package.json file (e0e712dd)

#### 0.0.5 (2016-12-11)

#### 0.0.4 (2016-12-11)

#### 0.0.3 (2016-12-11)

#### 0.0.2 (2016-12-11)

#### 0.0.1 (2016-12-11)
