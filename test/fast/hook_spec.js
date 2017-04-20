import { expect } from 'chai';
import { stub } from 'sinon';

import runHook from '../../src/util/hook';

describe('runHook', () => {
  it('should not error when running non existent hooks', async () => {
    await runHook({}, 'magic');
  });

  it('should not error when running a hook that is not a function', async () => {
    await runHook({ hooks: { myHook: 'abc' } }, 'abc');
  });

  it('should run the hook if it is provided as a function', async () => {
    const myStub = stub();
    myStub.returns(Promise.resolve());
    await runHook({ hooks: { myHook: myStub } }, 'myHook');
    expect(myStub.callCount).to.equal(1);
  });
});
