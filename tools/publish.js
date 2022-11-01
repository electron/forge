const childProcess = require('child_process');
const path = require('path');

const { spawn } = require('@malept/cross-spawn-promise');
const chalk = require('chalk');
const fs = require('fs-extra');
const { Listr } = require('listr2');

require('ts-node').register();

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

const prepare = new Listr([
  {
    title: 'Checking working directory',
    task: async () => {
      if (
        childProcess
          .execSync('git status -s', {
            cwd: BASE_DIR,
          })
          .toString() !== ''
      ) {
        throw new Error(chalk.red('Your working directory is not clean, please ensure you have a clean working directory before publishing'));
      }
    },
  },
  {
    title: 'Building all packages',
    task: () =>
      spawn('bolt', ['build'], {
        cwd: BASE_DIR,
      }),
  },
]);

const publisher = new Listr([
  {
    title: 'Collecting directories to publish',
    task: async (ctx) => {
      ctx.dirsToPublish = [];
      for (const subDir of await fs.readdir(PACKAGES_DIR)) {
        for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
          ctx.dirsToPublish.push(path.resolve(PACKAGES_DIR, subDir, packageDir));
        }
      }
    },
  },
  {
    title: 'Publishing all packages',
    task: async (ctx) => {
      return new Listr(
        await Promise.all(
          ctx.dirsToPublish.map(async (dir) => {
            const { name, version } = await fs.readJson(path.resolve(dir, 'package.json'));
            const isBeta = version.includes('beta');
            return {
              title: `Publishing: ${chalk.cyan(`${name}@${version}`)} (beta=${isBeta ? chalk.green('true') : chalk.red('false')})`,
              task: async () => {
                const npmIgnorePath = path.join(dir, '.npmignore');
                let writtenNpmIgnore = false;

                try {
                  await fs.promises.writeFile(npmIgnorePath, ['*.tsbuildinfo', '/test', '/src'].join('\n'));
                  writtenNpmIgnore = true;

                  await spawn('npm', ['publish', '--access=public', ...(isBeta ? ['--tag=beta'] : []), `--otp=${ctx.otp}`], {
                    cwd: dir,
                  });
                } catch (err) {
                  throw new Error(`Failed to publish ${chalk.cyan(`${name}@${version}`)} \n${err.stderr.toString()}`);
                } finally {
                  if (writtenNpmIgnore) {
                    await fs.promises.rm(npmIgnorePath);
                  }
                }
              },
            };
          })
        ),
        { concurrent: 5, exitOnError: false }
      );
    },
  },
]);

const runPublisher = async () => {
  const otp = await new Promise((resolve) => {
    process.stdin.once('data', (chunk) => {
      process.stdin.pause();
      resolve(chunk.toString());
    });
    process.stdout.write('Enter OTP: ');
    process.stdin.read();
  });
  publisher.run({ otp });
};

prepare
  .run()
  .then(runPublisher)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
