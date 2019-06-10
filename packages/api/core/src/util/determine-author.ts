import childProcess from 'child_process';
import { PackagePerson } from '@electron-forge/shared-types';
import { promisify } from 'util';
import username from 'username';

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
  } catch {
    return undefined;
  }
};

export default async () => (await getAuthorFromGitConfig()) || username();
