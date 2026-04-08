import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import chalk from 'chalk';
import fs from 'fs-extra';

const BASE_DIR = path.resolve(import.meta.dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

// Packages whose entry points have top-level side effects (CLI scripts)
// that cannot be safely imported in a test context.
const SKIP_IMPORT = new Set(['create-electron-app']);

(async () => {
  const dirsToCheck: string[] = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    const subDirPath = path.resolve(PACKAGES_DIR, subDir);
    const stat = await fs.lstat(subDirPath);
    if (stat.isDirectory()) {
      for (const packageDir of await fs.readdir(subDirPath)) {
        const packageDirPath = path.resolve(PACKAGES_DIR, subDir, packageDir);
        const stat = await fs.lstat(packageDirPath);
        if (stat.isDirectory()) {
          dirsToCheck.push(packageDirPath);
        }
      }
    }
  }

  let bad = false;
  for (const dir of dirsToCheck) {
    const pj = await fs.readJson(path.resolve(dir, 'package.json'));
    if (pj.name === '@electron-forge/cli') continue;
    // The entrypoint can be defined under `exports` or `main` in package.json now!
    // `exports` can be a string or an exports map object (e.g. { ".": { "default": "...", "types": "..." } })
    let main: string | undefined;
    let typings: string | undefined = pj.typings;
    if (typeof pj.exports === 'string') {
      main = pj.exports;
    } else if (typeof pj.exports === 'object' && pj.exports['.']) {
      const dotExport = pj.exports['.'];
      main = typeof dotExport === 'string' ? dotExport : dotExport.default;
      typings ??= typeof dotExport === 'object' ? dotExport.types : undefined;
    } else {
      main = pj.main;
    }
    if (!main || !(await fs.pathExists(path.resolve(dir, main)))) {
      console.error(
        `${chalk.cyan(`[${pj.name}]`)}:`,
        chalk.red(`Main entry not found (${main})`),
      );
      bad = true;
    } else if (!SKIP_IMPORT.has(pj.name)) {
      try {
        await import(pathToFileURL(path.resolve(dir, main)).href);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `${chalk.cyan(`[${pj.name}]`)}:`,
          chalk.red(`Failed to import main entry (${main}): ${message}`),
        );
        bad = true;
      }
    }
    if (!typings || !(await fs.pathExists(path.resolve(dir, typings)))) {
      console.error(
        `${chalk.cyan(`[${pj.name}]`)}:`,
        chalk.red(`Typings entry not found (${typings})`),
      );
      bad = true;
    }
  }

  if (bad) {
    process.exit(1);
  }
})().catch(console.error);
