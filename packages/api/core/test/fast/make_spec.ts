import * as path from 'path';

import { ForgeMakeResult } from '@electron-forge/shared-types';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

import { MakeOptions } from '../../src/api';
import make from '../../src/api/make';

describe('make', () => {
  const fixtureDir = path.resolve(__dirname, '..', 'fixture');

  it('works with scoped package names', async () => {
    const stubbedMake: (opts: MakeOptions) => Promise<ForgeMakeResult[]> = proxyquire.noCallThru().load('../../src/api/make', {
      '../util/read-package-json': {
        readMutatedPackageJson: () => Promise.resolve(require('../fixture/app-with-scoped-name/package.json')),
      },
    }).default;
    await stubbedMake({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-scoped-name'),
      overrideTargets: ['@electron-forge/maker-zip'],
      platform: 'linux',
      skipPackage: true,
    });
    after(() => proxyquire.callThru());
  });

  describe('overrideTargets inherits from forge config', () => {
    let stubbedMake: (opts: MakeOptions) => Promise<ForgeMakeResult[]>;

    before(() => {
      const electronPath = path.resolve(__dirname, 'node_modules/electron');
      stubbedMake = proxyquire.noCallThru().load('../../src/api/make', {
        '@electron-forge/core-utils': {
          getElectronModulePath: () => Promise.resolve(electronPath),
          getElectronVersion: () => Promise.resolve('1.0.0'),
        },
      }).default;
    });

    it('passes config properly', async () => {
      const results = await stubbedMake({
        arch: 'x64',
        dir: path.join(fixtureDir, 'app-with-custom-maker-config'),
        overrideTargets: ['../custom-maker'],
        platform: 'linux',
        skipPackage: true,
      });

      expect(results[0].artifacts).to.deep.equal(['from config']);
    });

    after(() => proxyquire.callThru());
  });

  describe('maker config validation', () => {
    it('throws an error if the name is missing', async () => {
      await expect(
        make({
          arch: 'x64',
          dir: path.join(fixtureDir, 'maker-sans-name'),
          platform: 'linux',
          skipPackage: true,
        })
      ).to.eventually.be.rejectedWith(/^The following maker config is missing a maker name:/);
    });

    it('throws an error if the name is not a string', async () => {
      await expect(
        make({
          arch: 'x64',
          dir: path.join(fixtureDir, 'maker-name-wrong-type'),
          platform: 'linux',
          skipPackage: true,
        })
      ).to.eventually.be.rejectedWith(/^The following maker config has a maker name that is not a string:/);
    });
  });

  it('can skip makers via config', async () => {
    const stubbedMake = proxyquire.noCallThru().load('../../src/api/make', {
      '../util/read-package-json': {
        readMutatedPackageJson: () => Promise.resolve(require('../fixture/app-with-maker-disable/package.json')),
      },
    }).default;
    await expect(
      stubbedMake({
        arch: 'x64',
        dir: path.join(fixtureDir, 'app-with-maker-disable'),
        platform: 'linux',
        skipPackage: true,
      })
    ).to.eventually.be.rejectedWith(/Could not find any make targets configured for the "linux" platform./);
    proxyquire.callThru();
  });
});
