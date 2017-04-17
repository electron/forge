export function checkSupportedPlatforms(pkg) {
  const osList = require(`${pkg}/package.json`).os || [];

  return osList.filter(os => !os.startsWith('!'));
}

export default checkSupportedPlatforms;
