import { ChildProcess, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

import { requestAppRestart } from '@electron-forge/core-utils/restart';
import { ElectronProcess } from '@electron-forge/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import start from '../../src/api/start';
import locateElectronExecutable from '../../src/util/electron-executable.js';
import findConfig from '../../src/util/forge-config.js';
import { readMutatedPackageJson } from '../../src/util/read-package-json.js';
import resolveDir from '../../src/util/resolve-dir.js';

vi.mock(import('node:child_process'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    spawn: vi.fn(),
  };
});

vi.mock(import('../../src/util/resolve-dir'), async () => {
  return {
    default: vi.fn().mockResolvedValue('dir'),
  };
});

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    listrCompatibleRebuildHook: vi.fn(),
    getElectronVersion: vi.fn(),
  };
});

vi.mock(import('../../src/util/electron-executable'), () => {
  return {
    default: vi.fn().mockResolvedValue('electron'),
  };
});

vi.mock(import('../../src/util/forge-config'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: vi.fn().mockReturnValue({
      pluginInterface: {
        triggerHook: vi.fn(),
        getHookListrTasks: vi.fn(),
        triggerMutatingHook: vi.fn(),
        overrideStartLogic: vi.fn().mockResolvedValue(false),
      },
    }),
  };
});

vi.mock(import('../../src/util/read-package-json'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    readMutatedPackageJson: vi.fn().mockResolvedValue({
      version: 'v13.3.7',
    }),
  };
});

vi.mock(import('../../src/util/hook'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getHookListrTasks: vi.fn(),
  };
});

describe('start', () => {
  it('spawns electron in the correct dir', async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn)).toHaveBeenCalledWith(
      'electron',
      expect.anything(),
      expect.anything(),
    );
  });

  it('allows plugin to override the start command with its own child process', async () => {
    vi.mocked(findConfig).mockResolvedValueOnce({
      pluginInterface: {
        triggerHook: vi.fn(),
        getHookListrTasks: vi.fn(),
        triggerMutatingHook: vi.fn(),
        overrideStartLogic: vi.fn().mockResolvedValue({
          tasks: [],
          result: new ChildProcess() as ElectronProcess,
        }),
      },
    } as any);

    await start({
      dir: import.meta.dirname,
      interactive: false,
    });

    expect(vi.mocked(spawn)).not.toHaveBeenCalled();
  });

  it("should pass electron '.' as the app path if not specified", async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0]).toEqual(
      expect.arrayContaining(['electron', expect.arrayContaining(['.'])]),
    );
  });

  it('should pass electron the app path if specified', async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
      appPath: './path/to/app.js',
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0]).toEqual(
      expect.arrayContaining([
        'electron',
        expect.arrayContaining(['./path/to/app.js']),
      ]),
    );
  });

  it('should enable electron logging if enableLogging=true', async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
      enableLogging: true,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][2]).toHaveProperty(
      'env',
      expect.objectContaining({ ELECTRON_ENABLE_LOGGING: 'true' }),
    );
  });

  it('should enable RUN_AS_NODE if runAsNode=true', async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
      runAsNode: true,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][2]).toHaveProperty(
      'env',
      expect.objectContaining({ ELECTRON_RUN_AS_NODE: 'true' }),
    );
  });

  it('should disable RUN_AS_NODE if runAsNode=false', async () => {
    await start({
      dir: import.meta.dirname,
      interactive: false,
      runAsNode: false,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][2].env).not.toHaveProperty(
      'ELECTRON_RUN_AS_NODE',
    );
  });

  it('should pass all args through to the spawned Electron instance', async () => {
    const args = ['magic_arg', 123, 'thingy'];
    await start({
      args,
      dir: import.meta.dirname,
      interactive: false,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][1]).toEqual(['.', ...args]);
  });

  it('should pass --inspect at the start of the args if inspect is set', async () => {
    const args = ['magic_arg', 123, 'thingy'];
    await start({
      args,
      dir: import.meta.dirname,
      interactive: false,
      inspect: true,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][1]).toEqual([
      '.',
      '--inspect',
      ...args,
    ]);
  });

  it('should pass --inspect-brk at the start of the args if inspectBrk is set', async () => {
    const args = ['magic_arg', 123, 'thingy'];
    await start({
      args,
      dir: import.meta.dirname,
      interactive: false,
      inspectBrk: true,
    });
    expect(vi.mocked(spawn)).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0][1]).toEqual([
      '.',
      '--inspect-brk',
      ...args,
    ]);
  });

  it('should resolve with a handle to the spawned instance', async () => {
    const child = new ChildProcess();
    vi.mocked(spawn).mockResolvedValueOnce(child);
    await expect(
      start({
        dir: import.meta.dirname,
        interactive: false,
      }),
    ).resolves.toEqual(child);
  });

  it('should throw if no dir could be found', async () => {
    vi.mocked(resolveDir).mockResolvedValueOnce(null);
    await expect(
      start({
        dir: import.meta.dirname,
        interactive: false,
      }),
    ).rejects.toThrowError('Failed to locate startable Electron application');
  });

  it('should throw if no version is in package.json', async () => {
    vi.mocked(readMutatedPackageJson).mockResolvedValueOnce({});
    await expect(
      start({
        dir: import.meta.dirname,
        interactive: false,
      }),
    ).rejects.toThrowError("Please set your application's 'version' in");
  });

  describe('restarting', () => {
    // A stand-in for a spawned Electron process that dies when killed.
    const fakeChild = () => {
      const child = new EventEmitter() as ElectronProcess & {
        kill: ReturnType<typeof vi.fn>;
      };
      child.kill = vi.fn(() => {
        child.emit('exit');
        child.emit('close');
        return true;
      });
      return child;
    };

    const spawnsInOrder = (...children: ReturnType<typeof fakeChild>[]) => {
      const mock = vi.mocked(spawn);
      for (const child of children) mock.mockReturnValueOnce(child);
      return children;
    };

    beforeEach(() => {
      // Silence the "Restarting Electron app" line.
      vi.spyOn(console, 'info').mockImplementation(() => undefined);
    });

    it('kills the running app and hands back its replacement', async () => {
      const [first, second] = spawnsInOrder(fakeChild(), fakeChild());

      const spawned = await start({
        dir: import.meta.dirname,
        interactive: false,
      });
      expect(spawned).toBe(first);

      const replaced = new Promise((resolve) =>
        spawned.on('restarted', resolve),
      );

      expect(requestAppRestart()).toBe(true);
      expect(first.restarted).toBe(true);
      expect(first.kill).toHaveBeenCalledWith('SIGTERM');

      // The event has to fire on the *exiting* child: that is what re-attaches
      // the CLI's exit handling to the replacement.
      await expect(replaced).resolves.toBe(second);
      expect(vi.mocked(spawn)).toHaveBeenCalledTimes(2);
    });

    it('initializes `restarted` instead of leaving it undefined', async () => {
      spawnsInOrder(fakeChild());

      const spawned = await start({
        dir: import.meta.dirname,
        interactive: false,
      });

      expect(spawned.restarted).toBe(false);
    });

    it('declines to restart when no app is running', async () => {
      // `spawn` is mocked with no return value, so nothing is ever running.
      await start({ dir: import.meta.dirname, interactive: false });

      expect(requestAppRestart()).toBe(false);
    });

    it('still restarts once more when asked mid-restart', async () => {
      spawnsInOrder(fakeChild(), fakeChild(), fakeChild());

      await start({ dir: import.meta.dirname, interactive: false });

      expect(requestAppRestart()).toBe(true);
      // A request landing mid-restart must not be dropped, or the app keeps
      // running the code that was just replaced.
      expect(requestAppRestart()).toBe(true);

      await vi.waitFor(() => expect(vi.mocked(spawn)).toHaveBeenCalledTimes(3));
    });

    it('keeps the replacement app when the old one closes late', async () => {
      const [first, second] = spawnsInOrder(fakeChild(), fakeChild());
      first.kill = vi.fn(() => {
        first.emit('exit');
        return true;
      });

      const spawned = await start({
        dir: import.meta.dirname,
        interactive: false,
      });
      const replaced = new Promise((resolve) =>
        spawned.on('restarted', resolve),
      );
      requestAppRestart();
      await replaced;

      // A late `close` from the old child must not clear the live replacement.
      first.emit('close');

      expect(requestAppRestart()).toBe(true);
      expect(second.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('reports a failed relaunch rather than rejecting unobserved', async () => {
      spawnsInOrder(fakeChild());
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      await start({ dir: import.meta.dirname, interactive: false });

      vi.mocked(locateElectronExecutable).mockRejectedValueOnce(
        new Error('electron is gone'),
      );
      requestAppRestart();

      // An unhandled rejection here would take down the whole Forge process.
      await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    });
  });

  // TODO(erickzhao): improve test coverage
  it.todo(
    'allows plugin to override the start command with a custom spawn string',
  );
  it.todo(
    'allows plugin to override the start command with a custom spawn string with args',
  );
  it.todo('runs the preStart hook');
  it.todo('runs the generateAssets hook');
});
