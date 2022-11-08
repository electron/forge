export default function isInstalled(pkg: string): boolean {
  try {
    require(pkg);
    return true;
  } catch {
    // Package doesn't exist -- must not be installable on this platform
    return false;
  }
}
