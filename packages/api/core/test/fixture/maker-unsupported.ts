export default class Maker {
  // Just so the maker isn't excluded
  platforms = [process.platform];

  isSupportedOnCurrentPlatform(): boolean {
    return false;
  }
}
