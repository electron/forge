import { ForgeHookFn, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';
import { SinonStub, stub } from 'sinon';

import { runHook, runMutatingHook } from '../../src/util/hook';

const fakeConfig = {
  pluginInterface: {
    triggerHook: async () => false,
    triggerMutatingHook: async (_hookName: string, item: unknown) => item,
  },
} as unknown as ResolvedForgeConfig;

describe('hooks', () => {
  describe('runHook', () => {
    it('should not error when running non existent hooks', async () => {
      await runHook({ ...fakeConfig }, 'preMake');
    });

    it('should not error when running a hook that is not a function', async () => {
      await runHook({ hooks: { preMake: 'abc' as unknown as ForgeHookFn<'preMake'> }, ...fakeConfig }, 'preMake');
    });

    it('should run the hook if it is provided as a function', async () => {
      const myStub = stub();
      myStub.returns(Promise.resolve());
      await runHook({ hooks: { preMake: myStub }, ...fakeConfig }, 'preMake');
      expect(myStub.callCount).to.equal(1);
    });
  });

  describe('runMutatingHook', () => {
    it('should return the input when running non existent hooks', async () => {
      const info = {
        foo: 'bar',
      };
      expect(await runMutatingHook({ ...fakeConfig }, 'readPackageJson', info)).to.equal(info);
    });

    it('should return the mutated input when returned from a hook', async () => {
      fakeConfig.pluginInterface.triggerMutatingHook = stub().returnsArg(1);
      const myStub = stub();
      myStub.returns(
        Promise.resolve({
          mutated: 'foo',
        })
      );
      const info = {
        foo: 'bar',
      };
      const output = await runMutatingHook({ hooks: { readPackageJson: myStub }, ...fakeConfig }, 'readPackageJson', info);
      expect(output).to.deep.equal({
        mutated: 'foo',
      });
      expect((fakeConfig.pluginInterface.triggerMutatingHook as SinonStub).firstCall.args[1]).to.deep.equal({
        mutated: 'foo',
      });
    });
  });
});
