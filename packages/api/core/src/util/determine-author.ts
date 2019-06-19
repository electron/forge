import childProcess from 'child_process';
import debug from 'debug';
import { PackagePerson } from '@electron-forge/shared-types';
import { promisify } from 'util';
import username from 'username';

const d = debug('electron-forge:determine-author');
const exec = promisify(childProcess.exec);

const execAndTrimResult = async (command: string, dir: string) => {
  const { stdout } = await exec(command, { cwd: dir });
  return stdout.trim();
};

const getAuthorFromGitConfig = async (dir: string): Promise<PackagePerson> => {
  try {
    const name = await execAndTrimResult('git config --get user.name', dir);
    const email = await execAndTrimResult('git config --get user.email', dir);
    return { name, email };
  } catch (err) {
    d('Error when getting git config:', err);
    return undefined;
  }
};

export default async (dir: string) => (await getAuthorFromGitConfig(dir)) || username();
