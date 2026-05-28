import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const tmplDir = path.resolve(import.meta.dirname, '../tmpl');

describe('BaseTemplate', () => {
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
