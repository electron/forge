import fs from 'fs-promise';
import ora from 'ora';
import path from 'path';

export default async(originalDir, buildPath, electronVersion, pPlatform, pArch, done) => {
  const compileSpinner = ora.ora('Compiling Application').start();

  const compileCLI = require(path.resolve(originalDir, 'node_modules/electron-compile/lib/cli.js'));

  async function compileAndShim(appDir) {
    for (const entry of await fs.readdir(appDir)) {
      if (!entry.match(/^(node_modules|bower_components)$/)) {
        const fullPath = path.join(appDir, entry);

        if ((await fs.stat(fullPath)).isDirectory()) {
          const log = console.log;
          console.log = () => {};
          await compileCLI.main(appDir, [fullPath]);
          console.log = log;
        }
      }
    }

    const packageJson = JSON.parse(await fs.readFile(path.join(appDir, 'package.json'), 'utf8'));

    const index = packageJson.main || 'index.js';
    packageJson.originalMain = index;
    packageJson.main = 'es6-shim.js';

    await fs.writeFile(path.join(appDir, 'es6-shim.js'),
      await fs.readFile(path.join(path.resolve(originalDir, 'node_modules/electron-compile/lib/es6-shim.js')), 'utf8'));

    await fs.writeFile(
      path.join(appDir, 'package.json'),
      JSON.stringify(packageJson, null, 2));
  }

  await compileAndShim(buildPath);

  compileSpinner.succeed();
  done();
};
