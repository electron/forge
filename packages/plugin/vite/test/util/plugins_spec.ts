/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { builtinModules } from 'module';

import { expect } from 'chai';
// eslint-disable-next-line node/no-extraneous-import
import { ExternalOption } from 'rollup';
import { resolveConfig } from 'vite';

import { externalBuiltins } from '../../src/util/plugins';

describe('plugins', () => {
  it('externalBuiltins', async () => {
    const builtins: any[] = [
      'electron',
      ...builtinModules.filter((e) => !e.startsWith('_')),
      ...builtinModules.filter((e) => !e.startsWith('_')).map((m) => `node:${m}`),
    ];
    const external_string: ExternalOption = 'electron';
    const external_array: ExternalOption = ['electron'];
    const external_regexp: ExternalOption = /electron/;
    const external_function: ExternalOption = (source) => ['electron'].includes(source);
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

    const external_str = (await getConfig(external_string))!.build!.rollupOptions!.external;
    expect(external_str).deep.equal(builtins.concat(external_string));

    const external_arr = (await getConfig(external_array))!.build!.rollupOptions!.external;
    expect(external_arr).deep.equal(builtins.concat(external_array));

    const external_reg = (await getConfig(external_regexp))!.build!.rollupOptions!.external;
    expect(external_reg).deep.equal(builtins.concat(external_regexp));

    const external_fun = (await getConfig(external_function))!.build!.rollupOptions!.external;
    expect((external_fun as (source: string) => boolean)('electron')).true;
  });
});
