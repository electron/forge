import fs from 'node:fs';
import path from 'node:path';

import * as testUtils from '@electron-forge/test-utils';
import { Listr } from 'listr2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import template from '../src/BaseTemplate';

const tmplDir = path.resolve(import.meta.dirname, '../tmpl');

describe('BaseTemplate', () => {
  describe('initializeTemplate', () => {
    it('should reject the typescript option', async () => {
      await expect(
        template.initializeTemplate('/tmp/forge-base-template-test', {
          typescript: true,
        }),
      ).rejects.toThrowError(
        'The "base" template does not support TypeScript. Use "--template vite" or "--template webpack" with "--typescript".',
      );
    });
  });

  describe('getDevDependencies', () => {
    it('adds the GitHub publisher when CI files are copied', () => {
      expect(template.getDevDependencies({ copyCIFiles: true })).toContainEqual(
        expect.stringMatching(/^@electron-forge\/publisher-github@\^/),
      );
    });

    it('does not add the GitHub publisher otherwise', () => {
      expect(template.getDevDependencies({})).not.toContainEqual(
        expect.stringMatching(/^@electron-forge\/publisher-github@/),
      );
    });
  });

  describe.each([false, true])('with copyCIFiles: %s', (copyCIFiles) => {
    let dir: string;

    beforeAll(async () => {
      dir = await testUtils.ensureTestDirIsNonexistent();
      const tasks = await template.initializeTemplate(dir, { copyCIFiles });
      const runner = new Listr(tasks, {
        concurrent: false,
        exitOnError: false,
        collectErrors: true,
        fallbackRendererCondition:
          Boolean(process.env.DEBUG) || Boolean(process.env.CI),
      });
      await runner.run();
      expect(runner.errors).toHaveLength(0);
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    });

    it.each(['build.yml', 'release.yml'])(
      `.github/workflows/%s should${copyCIFiles ? '' : ' not'} exist`,
      (file) => {
        expect(
          fs.existsSync(path.join(dir, '.github', 'workflows', file)),
        ).toBe(copyCIFiles);
      },
    );

    it(`should${copyCIFiles ? '' : ' not'} add the GitHub publisher to forge.config.js`, async () => {
      const forgeConfig = await fs.promises.readFile(
        path.join(dir, 'forge.config.js'),
        'utf8',
      );
      if (copyCIFiles) {
        expect(forgeConfig).toContain('publishers: [');
        expect(forgeConfig).toContain(
          "name: '@electron-forge/publisher-github'",
        );
      } else {
        expect(forgeConfig).not.toContain('publisher-github');
      }
    });

    if (copyCIFiles) {
      it('should fill in the package manager commands in the workflows', async () => {
        for (const file of ['build.yml', 'release.yml']) {
          const workflow = await fs.promises.readFile(
            path.join(dir, '.github', 'workflows', file),
            'utf8',
          );
          expect(workflow).not.toContain('__FORGE_PM_');
        }
      });
    }
  });

  describe('lint config files', () => {
    it('should include .oxfmtrc.json in the base template', () => {
      const oxfmtrcPath = path.join(tmplDir, '.oxfmtrc.json');
      expect(fs.existsSync(oxfmtrcPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(oxfmtrcPath, 'utf-8'));
      expect(content).not.toHaveProperty('ignorePatterns');
    });

    it('.oxfmtrc.json should match the repo root config (minus ignorePatterns)', () => {
      const baseTmpl = JSON.parse(
        fs.readFileSync(path.join(tmplDir, '.oxfmtrc.json'), 'utf-8'),
      );
      const repoRoot = JSON.parse(
        fs.readFileSync(
          path.resolve(import.meta.dirname, '../../../../.oxfmtrc.json'),
          'utf-8',
        ),
      );
      const { ignorePatterns, ...expected } = repoRoot;
      expect(baseTmpl).toEqual(expected);
    });

    it('.oxlintrc.json should exist in each template that uses writeLintConfig', () => {
      const templatesWithLintConfig = ['vite', 'webpack'];
      for (const template of templatesWithLintConfig) {
        const oxlintrcPath = path.resolve(
          import.meta.dirname,
          `../../${template}/tmpl/.oxlintrc.json`,
        );
        expect(
          fs.existsSync(oxlintrcPath),
          `missing .oxlintrc.json in ${template}`,
        ).toBe(true);
      }
    });
  });
});
