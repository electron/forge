/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { builtinModules } from 'module';

import { expect } from 'chai';
// eslint-disable-next-line node/no-extraneous-import
import { ExternalOption } from 'rollup';
import { resolveConfig } from 'vite';

import { externalBuiltins } from '../../src/util/plugins';

describe('plugins', () => {
  it('externalBuiltins', async () => {
    const nativeModules = builtinModules.filter((e) => !e.startsWith('_'));
    const builtins: any[] = ['electron', ...nativeModules, ...nativeModules.map((m) => `node:${m}`)];
    const getConfig = (external: ExternalOption) =>
      resolveConfig(
        {
          configFile: false,
          build: {
            rollupOptions: {
              external,
            },
          },
          plugins: [externalBuiltins()],
        },
        'build'
      );

    const external_string: ExternalOption = 'electron';
    const external_string2 = (await getConfig(external_string))!.build!.rollupOptions!.external;
    expect(external_string2).deep.equal(builtins.concat(external_string));

    const external_array: ExternalOption = ['electron'];
    const external_array2 = (await getConfig(external_array))!.build!.rollupOptions!.external;
    expect(external_array2).deep.equal(builtins.concat(external_array));

    const external_regexp: ExternalOption = /electron/;
    const external_regexp2 = (await getConfig(external_regexp))!.build!.rollupOptions!.external;
    expect(external_regexp2).deep.equal(builtins.concat(external_regexp));

    const external_function: ExternalOption = (source) => ['electron'].includes(source);
    const external_function2 = (await getConfig(external_function))!.build!.rollupOptions!.external;
    expect((external_function2 as (source: string) => boolean)('electron')).true;
  });
});
