import { ForgeConfig, ForgeHookFn } from '@electron-forge/shared-types';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';

import { runHook, runMutatingHook } from '../../src/util/hook';

const fakeConfig = {
  pluginInterface: {
    triggerHook: async () => false,
    triggerMutatingHook: async (_hookName: string, item: unknown) => item,
  },
} as unknown as ForgeConfig;

describe('hooks', () => {
  describe('runHook', () => {
    it('should not error when running non existent hooks', async () => {
      await runHook({ ...fakeConfig }, 'magic');
    });

    it('should not error when running a hook that is not a function', async () => {
      await runHook({ hooks: { myHook: 'abc' as unknown as ForgeHookFn }, ...fakeConfig }, 'abc');
    });

    it('should run the hook if it is provided as a function', async () => {
      const myStub = stub();
      myStub.returns(Promise.resolve());
      await runHook({ hooks: { myHook: myStub }, ...fakeConfig }, 'myHook');
      expect(myStub.callCount).to.equal(1);
    });
  });

  describe('runMutatingHook', () => {
    it('should return the input when running non existent hooks', async () => {
      expect(await runMutatingHook({ ...fakeConfig }, 'magic', 'input')).to.equal('input');
    });

    it('should return the mutated input when returned from a hook', async () => {
      fakeConfig.pluginInterface.triggerMutatingHook = stub().returnsArg(1);
      const myStub = stub();
      myStub.returns(Promise.resolve('magneto'));
      const output = await runMutatingHook({ hooks: { myHook: myStub }, ...fakeConfig }, 'myHook', 'input');
      expect(output).to.equal('magneto');
      expect((fakeConfig.pluginInterface.triggerMutatingHook as SinonStub).firstCall.args[1]).to.equal('magneto');
    });
  });
});
