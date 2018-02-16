import { expect } from 'chai';
import inquirer from 'inquirer';
import sinon from 'sinon';

import confirmIfInteractive from '../../src/util/confirm-if-interactive';

describe('confirm if interactive', () => {
  describe('if interactive=true', () => {
    let createPromptModuleSpy;

    beforeEach(() => {
      createPromptModuleSpy = sinon.stub(inquirer, 'createPromptModule');
      createPromptModuleSpy.returns(() => Promise.resolve({ confirm: 'resolved' }));
    });

    it('should call inquirer prompt', async () => {
      const val = await confirmIfInteractive(true, 'Please say yes?');
      expect(createPromptModuleSpy.callCount).to.equal(1);
      expect(val).to.equal('resolved');
    });

    afterEach(() => {
      createPromptModuleSpy.restore();
    });
  });

  describe('if interactive=false', () => {
    it('should return true', async () => {
      expect(await confirmIfInteractive(false, 'Yolo!')).to.equal(true);
    });

    it('should return the defaultValue if provided', async () => {
      expect(await confirmIfInteractive(false, 'Yolo!', 'default_value')).to.equal('default_value');
    });
  });
});
