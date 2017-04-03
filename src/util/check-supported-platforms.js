export function checkSupportedPlatforms(pkg) {
  let osList;
  try {
    osList = require(`${pkg}/package.json`).os;
  } catch (e) {
    //
  }

  osList = osList || ['darwin', 'linux', 'win32'];

  return osList.filter(os => !os.startsWith('!'));
}

export default checkSupportedPlatforms;
