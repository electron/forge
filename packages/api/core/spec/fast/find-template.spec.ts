import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

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
    it('should find an @electron-forge/template based on name', async () => {
      await expect(findTemplate('fixture')).resolves.toEqual({ name: 'electron-forge-template-fixture' });
    });
    it('should find an @electron-forge/template based on name', async () => {
      await expect(findTemplate('fixture-two')).resolves.toEqual({ name: 'electron-forge-template-fixture' });
    });
    it('should find an @electron-forge/template based on name', async () => {
      await expect(findTemplate('electron-forge-template-fixture-two')).resolves.toEqual({ name: 'electron-forge-template-fixture' });
    });
  });

  /**
   * For global modules, we re-route the global NPM `node_modules` directory to
   * a folder in our fixture directory. Note that the folder _needs_ to be called
   * `node_modules` in order for the `require.resolve` custom path to work.
   */
  describe('global modules', () => {
    vi.mock(import('global-dirs'), async (importOriginal) => {
      const mod = await importOriginal();
      return {
        default: {
          ...mod.default,
          npm: {
            ...mod.default.npm,
            packages: path.resolve(__dirname, '..', 'fixture', 'global-stub', 'node_modules'),
          },
        },
      };
    });
    it('should find an @electron-forge/template based on name', async () => {
      await expect(findTemplate('global')).resolves.toEqual({ name: 'electron-forge-template-fixture-global' });
    });
    it('should find an electron-forge-template based on name', async () => {
      await expect(findTemplate('global-two')).resolves.toEqual({ name: 'electron-forge-template-fixture-global' });
    });
  });

  it('should error if there are no valid templates', async () => {
    await expect(findTemplate('non-existent-template')).rejects.toThrowError('Failed to locate custom template: "non-existent-template".');
  });
});
