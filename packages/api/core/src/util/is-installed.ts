export default function isInstalled(pkg: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(pkg);
    return true;
  } catch {
    // Package doesn't exist -- must not be installable on this platform
    return false;
  }
}
