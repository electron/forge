import { describe, expect, it } from 'vitest';

import { findTemplate } from '../../src/api/init-scripts/find-template';

describe('findTemplate', () => {
  /**
   * Note: this test suite does not mock `require.resolve`. Instead, it uses
   * fixture dependencies defined in this module's package.json file to
   * actually resolve a local template.
   *
   * If you modify the fixtures, you may need to re-run `yarn install` in order
   * for the fixtures to be installed in your local `node_modules`.
   */
  describe('local modules', () => {
    it('should find an @electron-forge/template based on partial name', async () => {
      await expect(findTemplate('fixture')).resolves.toEqual(
        expect.objectContaining({ name: '@electron-forge/template-fixture' }),
      );
    });

    it('should find an @electron-forge/template based on full name', async () => {
      await expect(
        findTemplate('@electron-forge/template-fixture'),
      ).resolves.toEqual(
        expect.objectContaining({ name: '@electron-forge/template-fixture' }),
      );
    });
    it('should find an electron-forge-template based on partial name', async () => {
      await expect(findTemplate('fixture-two')).resolves.toEqual(
        expect.objectContaining({
          name: 'electron-forge-template-fixture-two',
        }),
      );
    });
    it('should find an @electron-forge-template based on full name', async () => {
      await expect(
        findTemplate('electron-forge-template-fixture-two'),
      ).resolves.toEqual(
        expect.objectContaining({
          name: 'electron-forge-template-fixture-two',
        }),
      );
    });
  });

  it('should error if there are no valid templates', async () => {
    await expect(findTemplate('non-existent-template')).rejects.toThrowError(
      'Failed to locate custom template: "non-existent-template".',
    );
  });
});
