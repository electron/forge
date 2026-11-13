import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

import * as testUtils from '@electron-forge/test-utils';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import vite from '../../vite/src/ViteTemplate';
import webpack from '../../webpack/src/WebpackTemplate';
import base from '../src/BaseTemplate';

const variants = [
  { name: 'base', template: base, typescript: false, development: false },
  ...[false, true].flatMap((typescript) => [
    {
      name: `vite TS=${typescript} development`,
      template: vite,
      typescript,
      development: true,
    },
    {
      name: `vite TS=${typescript} packaged`,
      template: vite,
      typescript,
      development: false,
    },
    {
      name: `webpack TS=${typescript}`,
      template: webpack,
      typescript,
      development: false,
    },
  ]),
];

describe.each(variants)(
  '$name window visibility',
  ({ template, typescript, development }) => {
    let dir: string;
    let code: string;

    beforeAll(async () => {
      dir = await testUtils.ensureTestDirIsNonexistent();
      const tasks = await template.initializeTemplate(dir, { typescript });
      for (const { task } of tasks) {
        await (task as () => Promise<void>)();
      }
      const filename =
        template === base ? 'index.js' : `main.${typescript ? 'ts' : 'js'}`;
      code = ts.transpileModule(
        await fs.readFile(path.join(dir, 'src', filename), 'utf8'),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
          },
        },
      ).outputText;
    });

    afterAll(async () => {
      await fs.rm(dir, { recursive: true, force: true });
    });

    const start = async () => {
      const windows: BrowserWindow[] = [];
      const app = Object.assign(new EventEmitter(), {
        whenReady: () => Promise.resolve(),
        quit: vi.fn(),
      });
      class BrowserWindow extends EventEmitter {
        static getAllWindows = () => windows;
        show = vi.fn();
        webContents = { openDevTools: vi.fn() };
        loadFile = vi.fn();
        loadURL = vi.fn();

        constructor(
          public options: {
            show?: boolean;
            paintWhenInitiallyHidden?: boolean;
            webPreferences: { preload: string };
          },
        ) {
          super();
          windows.push(this);
        }
      }
      vm.runInNewContext(code, {
        require: (name: string) => {
          if (name === 'electron') return { app, BrowserWindow };
          if (name === 'node:path') return path;
          if (name === 'electron-squirrel-startup') return false;
          throw new Error(`Unexpected module: ${name}`);
        },
        exports: {},
        __dirname: path.join(dir, 'src'),
        process,
        MAIN_WINDOW_VITE_DEV_SERVER_URL: development
          ? 'http://localhost:5173'
          : undefined,
        MAIN_WINDOW_VITE_NAME: 'main_window',
        MAIN_WINDOW_WEBPACK_ENTRY: 'http://localhost:3000/main_window',
        MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: '/preload.cjs',
      });
      await Promise.resolve();
      return { app, windows };
    };

    it('waits for the initial render and shows only once', async () => {
      const { windows } = await start();
      expect(windows).toHaveLength(1);
      const [window] = windows;
      expect(window.options.show).toBe(false);
      expect(window.options.paintWhenInitiallyHidden).not.toBe(false);
      expect(window.options.webPreferences.preload).toBeTruthy();
      expect(window.show).not.toHaveBeenCalled();
      expect(
        window.loadFile.mock.calls.length + window.loadURL.mock.calls.length,
      ).toBe(1);
      if (template === webpack || development) {
        expect(window.loadURL).toHaveBeenCalledWith(
          template === webpack
            ? 'http://localhost:3000/main_window'
            : 'http://localhost:5173',
        );
      } else {
        expect(window.loadFile).toHaveBeenCalledWith(
          template === base
            ? path.join(dir, 'src', 'index.html')
            : path.join(dir, 'renderer', 'main_window', 'index.html'),
        );
      }
      window.emit('ready-to-show');
      expect(window.show).toHaveBeenCalledTimes(1);
      window.emit('ready-to-show');
      expect(window.show).toHaveBeenCalledTimes(1);
    });

    it('applies the same visibility lifecycle to a window recreated on activation', async () => {
      const { app, windows } = await start();
      app.emit('activate');
      expect(windows).toHaveLength(1);
      const [closedWindow] = windows.splice(0);
      app.emit('activate');
      expect(windows).toHaveLength(1);
      const [window] = windows;
      expect(window.options.show).toBe(false);
      expect(window.show).not.toHaveBeenCalled();
      window.emit('ready-to-show');
      expect(window.show).toHaveBeenCalledTimes(1);
      expect(closedWindow.show).not.toHaveBeenCalled();
    });
  },
);
