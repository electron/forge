export default function isInstalled(pkg: string) {
  try {
    require(pkg);
    return true;
  } catch (e) {
    // Package doesn't exist -- must not be installable on this platform
    return false;
  }
}
