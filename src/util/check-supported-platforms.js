export function checkSupportedPlatforms(pkg) {
  return require(`${pkg}/package.json`).os || [];
}

export default checkSupportedPlatforms;
