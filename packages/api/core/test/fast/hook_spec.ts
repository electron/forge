import { ForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';
import { stub } from 'sinon';

import runHook from '../../src/util/hook';

const fakeConfig = {
  pluginInterface: {
    triggerHook: async () => false,
  },
} as any as ForgeConfig;

describe('runHook', () => {
  it('should not error when running non existent hooks', async () => {
    await runHook(Object.assign({}, fakeConfig), 'magic');
  });

  it('should not error when running a hook that is not a function', async () => {
    await runHook(Object.assign({ hooks: { myHook: 'abc' } }, fakeConfig), 'abc');
  });

  it('should run the hook if it is provided as a function', async () => {
    const myStub = stub();
    myStub.returns(Promise.resolve());
    await runHook(Object.assign({ hooks: { myHook: myStub } }, fakeConfig), 'myHook');
    expect(myStub.callCount).to.equal(1);
  });
});
