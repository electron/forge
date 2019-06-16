import childProcess from 'child_process';
import debug from 'debug';
import { PackagePerson } from '@electron-forge/shared-types';
import { promisify } from 'util';
import username from 'username';

const d = debug('electron-forge:determine-author');
const exec = promisify(childProcess.exec);

const execAndTrimResult = async (command: string) => {
  const { stdout } = await exec(command);
  return stdout.trim();
};

const getAuthorFromGitConfig = async (): Promise<PackagePerson> => {
  try {
    const name = await execAndTrimResult('git config --get user.name');
    const email = await execAndTrimResult('git config --get user.email');
    return { name, email };
  } catch (err) {
    d('Error when getting git config:', err);
    return undefined;
  }
};

export default async () => (await getAuthorFromGitConfig()) || username();
