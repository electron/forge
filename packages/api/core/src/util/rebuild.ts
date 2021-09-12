import { asyncOra } from '@electron-forge/async-ora';
import { ForgePlatform, ForgeArch } from '@electron-forge/shared-types';

import { rebuild, RebuildOptions } from 'electron-rebuild';

export default async (
  buildPath: string,
  electronVersion: string,
  platform: ForgePlatform,
  arch: ForgeArch,
  config: Partial<RebuildOptions> = {}
): Promise<void> => {
  await asyncOra('Preparing native dependencies', async (rebuildSpinner) => {
    const rebuilder = rebuild({
      ...config,
      buildPath,
      electronVersion,
      arch,
    });
    const { lifecycle } = rebuilder;

    let found = 0;
    let done = 0;

    const redraw = () => {
      rebuildSpinner.text = `Preparing native dependencies: ${done} / ${found}`;
    };

    lifecycle.on('module-found', () => {
      found += 1;
      redraw();
    });
    lifecycle.on('module-done', () => {
      done += 1;
      redraw();
    });

    await rebuilder;
  });
};
