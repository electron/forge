import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

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
