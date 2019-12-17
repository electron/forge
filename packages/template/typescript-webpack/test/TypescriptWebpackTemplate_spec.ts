import * as testUtils from '@electron-forge/test-utils';
import fs from 'fs-extra';
import path from 'path';
// import spawnPromise from 'cross-spawn-promise';
import template from '../src/TypeScriptWebpackTemplate';

describe('TypeScriptWebpackTemplate', () => {
  let dir: string;

  before(async () => {
    dir = await testUtils.ensureTestDirIsNonexistent();
  });

  it('should succeed in initializing the typescript template', async () => {
    await template.initializeTemplate(dir, {});
  });

  it('should copy the appropriate template files', async () => {
    const expectedFiles = [
      'tsconfig.json',
      'tslint.json',
      'webpack.main.config.js',
      'webpack.renderer.config.js',
      'webpack.rules.js',
      'webpack.plugins.js',
      path.join('src', 'index.ts'),
      path.join('src', 'renderer.ts'),
    ];

    for (const filename of expectedFiles) {
      await testUtils.expectProjectPathExists(dir, filename, 'file');
    }
  });

  // describe('lint', () => {
  //   it('should initially pass the linting process', async () => {
  //     try {
  // eslint-disable-next-line max-len
  //       await (spawnPromise as Function)('npm', ['install', 'tslint', 'typescript'], { cwd: dir });
  //       await (spawnPromise as Function)('npm', ['run', 'lint'], { cwd: dir });
  //     } catch (err) {
  //       if (err.stdout) {
  //         // eslint-disable-next-line no-console
  //         console.error('STDOUT:', err.stdout.toString());
  //         // eslint-disable-next-line no-console
  //         console.error('STDERR:', err.stderr.toString());
  //       }
  //       throw err;
  //     }
  //   });
  // });

  after(async () => {
    await fs.remove(dir);
  });
});
