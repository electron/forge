import { expect } from 'chai';
import * as path from 'path';
import proxyquire from 'proxyquire';

import { MakeOptions } from '../../src/api';

describe('make', () => {
  let make: (opts: MakeOptions) => Promise<any[]>;
  beforeEach(() => {
    const electronPath = path.resolve(__dirname, 'node_modules/electron');
    make = proxyquire.noCallThru().load('../../src/api/make', {
      '../util/electron-version': {
        getElectronModulePath: () => Promise.resolve(electronPath),
        getElectronVersion: () => Promise.resolve('1.0.0'),
      },
    }).default;
  });
  describe('overrideTargets inherits from forge config', () => {
    it('passes config properly', async () => {
      const results = await make({
        arch: 'x64',
        dir: path.resolve(__dirname, '..', 'fixture', 'app-with-custom-maker-config'),
        overrideTargets: ['../custom-maker'],
        platform: 'linux',
        skipPackage: true,
      });

      expect(results[0].artifacts).to.deep.equal(['from config']);
    });
  });
});
