export default function isInstalled(pkg) {
  try {
    require(pkg);
    return true;
  } catch (e) {
    // Package doesn't exist -- must not be installable on this platform
    return false;
  }
}
