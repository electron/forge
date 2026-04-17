import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { SupportedPackageManager } from '@electron-forge/core-utils';
import {
  testForgeTemplate,
  TestForgeTemplateOptions,
} from '@electron-forge/test-utils';

describe('base template', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'electron-forge-test-'),
    );
  });

  // TODO use hardcoded value for each template test
  const templateName: TestForgeTemplateOptions['templateName'] = 'base';

  /**
   * Note: `testForgeTemplate` currently attempts to make some changes to
   * projects based on the TypeScript templates to change them to ESM, but the
   * regular `base` / `vite` / `webpack` templates require manual modification.
   */
  test.each([
    ['cjs', 'npm'],
    // ['es', 'npm'],
    ['cjs', 'pnpm'],
    // ['es', 'pnpm'],
    ['cjs', 'yarn'],
    // ['es', 'yarn'],
  ] as Array<
    [
      TestForgeTemplateOptions['moduleFormat'],
      TestForgeTemplateOptions['packageManager'],
    ]
  >)(
    `can launch a \`%s\` project created from \`template-${templateName}\` with \`%s\``,
    async (moduleFormat, packageManager) => {
      const { mainProcessOk, preloadProcessOk } = await testForgeTemplate({
        moduleFormat,
        packageManager,
        templateName,
        tmpDir,
      });

      expect(mainProcessOk).toBe(true);
      expect(preloadProcessOk).toBe(true);

      const lockFile = (
        {
          npm: 'package-lock.json',
          pnpm: 'pnpm-lock.yaml',
          yarn: 'yarn.lock',
        } as Record<SupportedPackageManager, string>
      )[packageManager];

      expect(fs.existsSync(path.resolve(tmpDir, lockFile))).toBe(true);
    },
  );

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});
