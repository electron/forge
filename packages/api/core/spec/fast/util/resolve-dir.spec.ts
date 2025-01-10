import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { registerForgeConfigForDirectory, unregisterForgeConfigForDirectory } from '../../../src/util/forge-config';
import resolveDir from '../../../src/util/resolve-dir';

describe('resolve-dir', () => {
  it('should return null if a valid dir can not be found', async () => {
    expect(await resolveDir('/foo/var/fake')).toEqual(null);
  });

  it('should return a directory if a forge config is found, but no package.json.forge.config', async () => {
    const dir = path.resolve(__dirname, '../../../test/fixture/forge-config-no-package-json-config/');
    const resolved = await resolveDir(dir);
    expect(resolved).not.toBeNull();
    expect(resolved).toEqual(dir);
  });

  it('should return a directory if it finds a node module', async () => {
    const dir = path.resolve(__dirname, '../../../test/fixture/dummy_app/foo');
    const resolved = await resolveDir(dir);
    expect(resolved).not.toBeNull();
    expect(await resolveDir(path.resolve(__dirname, '../../../test/fixture/dummy_app/foo'))).toEqual(
      path.resolve(__dirname, '../../../test/fixture/dummy_app')
    );
  });

  it('should return a directory if it finds a virtual config', async () => {
    try {
      registerForgeConfigForDirectory('/foo/var/virtual', {});
      expect(await resolveDir('/foo/var/virtual')).not.toEqual(null);
      expect(await resolveDir(path.resolve(__dirname, '/foo/var/virtual'))).toEqual(path.resolve(__dirname, '/foo/var/virtual'));
    } finally {
      unregisterForgeConfigForDirectory('/foo/var/virtual');
    }
  });
});
