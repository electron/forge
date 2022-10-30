import * as cp from 'child_process';
import * as path from 'path';

import { asyncOra } from '@electron-forge/async-ora';
import { ForgeArch, ForgeListrTask, ForgePlatform } from '@electron-forge/shared-types';
import { rebuild, RebuildOptions } from 'electron-rebuild';

export const listrCompatibleRebuildHook = async (
  buildPath: string,
  electronVersion: string,
  platform: ForgePlatform,
  arch: ForgeArch,
  config: Partial<RebuildOptions> = {},
  task: ForgeListrTask<any>
): Promise<void> => {
  task.title = 'Preparing native dependencies';

  const options: RebuildOptions = {
    ...config,
    buildPath,
    electronVersion,
    arch,
  };

  const child = cp.fork(path.resolve(__dirname, 'remote-rebuild.js'), [JSON.stringify(options)], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  let pendingError: unknown;
  let found = 0;
  let done = 0;

  const redraw = () => {
    task.title = `Preparing native dependencies: ${done} / ${found}`;
  };

  child.stdout?.on('data', (chunk) => {
    task.output = chunk.toString();
  });
  child.stderr?.on('data', (chunk) => {
    task.output = chunk.toString();
  });

  child.on('message', (message: any) => {
    switch (message.msg) {
      case 'module-found': {
        found += 1;
        redraw();
        break;
      }
      case 'module-done': {
        done += 1;
        redraw();
        break;
      }
      case 'rebuild-error': {
        pendingError = new Error(message.err.message);
        (pendingError as any).stack = message.err.stack;
        break;
      }
      case 'rebuild-done': {
        task.task.rendererTaskOptions.persistentOutput = false;
        break;
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0 && !pendingError) {
        resolve();
      } else {
        reject(pendingError || new Error(`Rebuilder failed with exit code: ${code}`));
      }
    });
  });
};

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
