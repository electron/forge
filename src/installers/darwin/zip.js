import fs from 'fs-promise';
import inquirer from 'inquirer';
import path from 'path';
import pify from 'pify';
import sudo from 'sudo-prompt';
import { exec, spawn } from 'child_process';

export default async (filePath, installSpinner) => {
  await new Promise((resolve) => {
    const child = spawn('unzip', ['-q', '-o', path.basename(filePath)], {
      cwd: path.dirname(filePath),
    });
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    child.on('exit', () => resolve());
  });
  let writeAccess = true;
  try {
    await fs.access('/Applications', fs.W_OK);
  } catch (err) {
    writeAccess = false;
  }
  const appPath = (await fs.readdir(path.dirname(filePath))).filter(file => file.endsWith('.app'))
    .map(file => path.resolve(path.dirname(filePath), file))
    .sort((fA, fB) => fs.statSync(fA).ctime.getTime() - fs.statSync(fB).ctime.getTime())[0];

  const targetApplicationPath = `/Applications/${path.basename(appPath)}`;
  if (await fs.exists(targetApplicationPath)) {
    installSpinner.stop();
    const { confirm } = await inquirer.createPromptModule()({
      type: 'confirm',
      name: 'confirm',
      message: `The application "${path.basename(targetApplicationPath)}" appears to already exist in /Applications. Do you want to replace it?`,
    });
    if (!confirm) {
      throw new Error('Installation stopped by user');
    } else {
      installSpinner.start();
      await fs.remove(targetApplicationPath);
    }
  }

  const moveCommand = `mv "${appPath}" "${targetApplicationPath}"`;
  if (writeAccess) {
    await pify(exec)(moveCommand);
  } else {
    await pify(sudo.exec)(moveCommand, {
      name: 'Electron Forge',
    });
  }

  spawn('open', ['-R', targetApplicationPath], { detached: true });
};
