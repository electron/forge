/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import { expect } from 'chai';
import { build, type Plugin, resolveConfig } from 'vite';

import { externalBuiltins, hotRestart } from '../../src/util/plugins';

import type { ExternalOption, RollupWatcher } from 'rollup';

export type RestartType = 'auto' | 'manually' | null;

describe('interval Vite plugins', () => {
  it('vite-plugin externalBuiltins', async () => {
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

  it('vite-plugin hotRestart', async () => {
    const createBuild = (plugin: Plugin) =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise<RollupWatcher>(async (resolve) => {
        let isFirstStart: undefined | true;
        const root = path.join(__dirname, '../fixture');
        const entryFile = path.join(root, 'lib-entry.ts');
        const watcher = (await build({
          configFile: false,
          root,
          build: {
            lib: {
              entry: 'lib-entry.ts',
              formats: ['cjs'],
            },
            watch: {},
          },
          plugins: [
            // `hotStart` plugin
            plugin,
            {
              name: 'close-watcher',
              async closeBundle() {
                if (isFirstStart == null) {
                  isFirstStart = true;

                  // Trigger hot restart
                  setTimeout(() => {
                    fs.writeFileSync(entryFile, fs.readFileSync(entryFile, 'utf8'));
                  }, 100);
                } else {
                  watcher.close();
                  resolve(watcher);
                }
              },
            },
          ],
          logLevel: 'silent',
        })) as RollupWatcher;
      });

    const autoRestart = await (async () => {
      let restart: RestartType | undefined;
      // If directly manipulating `process.stdin` of the Main process will cause some side-effects,
      // then this should be rewritten with a Child porcess. 🚧
      process.stdin.once('data', (data: Buffer) => {
        if (data.toString().trim() === 'rs') {
          restart = 'auto';
        }
        process.stdin.destroy();
      });
      await createBuild(hotRestart({}, { renderers: [] }));
      return restart;
    })();

    const manuallyRestart = await (async () => {
      let restart: RestartType | undefined;
      await createBuild(
        hotRestart(
          {
            restart() {
              restart = 'manually';
            },
          },
          { renderers: [] }
        )
      );
      return restart;
    })();

    expect(autoRestart).equal('auto');
    expect(manuallyRestart).equal('manually');
  });
});
