import ora from 'ora';
import { spawn as yarnOrNPMSpawn } from 'yarn-or-npm';

const run = dir =>
  new Promise((resolve, reject) => {
    const child = yarnOrNPMSpawn(['run', 'lint', '--', '--fix'], {
      cwd: dir,
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      if (code !== 0) reject(new Error(`Failed to fix JS to standard style (${code})`));
    });
  });

export default async (dir) => {
  const initSpinner = ora('Applying Standard Style to JS').start();
  try {
    await run(dir);
  } catch (err) {
    initSpinner.fail();
    throw err;
  }
  initSpinner.succeed();
};
