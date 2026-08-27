import fsPromises from 'node:fs/promises';

import fs from 'graceful-fs';

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(filePath: string): Promise<any> {
  return JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJsonSync(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export async function writeJson(
  filePath: string,
  data: unknown,
  options: { spaces?: number } = {},
): Promise<void> {
  await fsPromises.writeFile(
    filePath,
    `${JSON.stringify(data, null, options.spaces)}\n`,
  );
}

interface MoveOptions {
  overwrite?: boolean;
}

export async function move(
  src: string,
  dest: string,
  options: MoveOptions = {},
): Promise<void> {
  if (options.overwrite) {
    await fsPromises.rm(dest, { recursive: true, force: true });
  } else if (await pathExists(dest)) {
    throw new Error(`dest already exists: ${dest}`);
  }
  try {
    await fsPromises.rename(src, dest);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    await fsPromises.cp(src, dest, { recursive: true });
    await fsPromises.rm(src, { recursive: true, force: true });
  }
}

export function moveSync(
  src: string,
  dest: string,
  options: MoveOptions = {},
): void {
  if (options.overwrite) {
    fs.rmSync(dest, { recursive: true, force: true });
  } else if (fs.existsSync(dest)) {
    throw new Error(`dest already exists: ${dest}`);
  }
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    fs.cpSync(src, dest, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  }
}
