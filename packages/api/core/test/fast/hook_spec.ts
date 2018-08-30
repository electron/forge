import { ForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';

import { runHook, runMutatingHook } from '../../src/util/hook';

const fakeConfig = {
  pluginInterface: {
    triggerHook: async () => false,
    triggerMutatingHook: async (_: any, item: any) => item,
  },
} as any as ForgeConfig;

describe('hooks', () => {
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

  describe('runMutatingHook', () => {
    it('should return the input when running non existent hooks', async () => {
      expect(await runMutatingHook(Object.assign({}, fakeConfig), 'magic', 'input')).to.equal('input');
    });

    it('should return the mutated input when returned from a hook', async () => {
      fakeConfig.pluginInterface.triggerMutatingHook = stub().returnsArg(1);
      const myStub = stub();
      myStub.returns(Promise.resolve('magneto'));
      const output = await runMutatingHook(Object.assign({ hooks: { myHook: myStub } }, fakeConfig), 'myHook', 'input');
      expect(output).to.equal('magneto');
      expect((fakeConfig.pluginInterface.triggerMutatingHook as SinonStub).firstCall.args[1]).to.equal('magneto');
    });
  });
});
